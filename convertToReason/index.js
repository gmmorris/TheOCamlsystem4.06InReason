const refmt = require('refmt');
const { JSDOM } = require('jsdom');

const colors = require('colors/safe');
const callAndReturn = callback => s => {
  callback(s)
  return s;
};
const logSuccess = callAndReturn(s => console.log(colors.rainbow(s)));
const logInfo = callAndReturn(s => console.log(colors.green(s)));
const logError = callAndReturn(s => console.log(colors.red(s)));
const logCode = callAndReturn(s => console.log(colors.blue(s)));
const logEcho = callAndReturn(s => console.log(colors.yellow(s)));

const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const chunk = require('lodash.chunk');
const flatten = require('lodash.flatten');

const rimraf = require('rimraf');
const rmrfAsync = promisify(rimraf);

const shell = require('shelljs');
shell.config.fatal = true;
shell.config.silent = true;

const { ncp } = require('ncp');
ncp.limit = 16;

const ncpAsync = (src, dest) => new Promise((resolve, reject) => {
  ncp(src, dest, function (err) {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});

const regexForExtension = /(?:\.([^.]+))?$/;
const regexForFileExample = /[fF]ile\s[a-zA-Z]+\.ml\s/gm;
const parsingError = /^[\s\t]*File[^\n]+\n Error:.+[\s\t]*/;

const findOCamlCodeElements = dom => [].slice.call(dom.window.document.querySelectorAll(".caml-input"));
const findUnmarkedPreNodes = dom =>
  [].slice.call(dom.window.document.querySelectorAll("pre"))
    .filter(preNode => preNode.textContent && preNode.textContent.length)
    .filter(preNode => !!regexForFileExample.exec(preNode.textContent));

const injectHighlighter = dom => {
  const { document } = dom.window;
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = './highlight/highlight.pack.js';

  var style = document.createElement('link');
  style.setAttribute('rel', 'stylesheet');
  style.setAttribute('href', './highlight/styles/default.css');

  const head = document.getElementsByTagName('head');
  head[0].appendChild(style);
  head[0].appendChild(script);

  var runHighlightScript = document.createElement('script');
  runHighlightScript.lang = 'javascript';
  runHighlightScript.textContent = `
    Array.prototype.slice.call(document.querySelectorAll('.re-input'))
      .forEach(function(block){hljs.highlightBlock(block);});
  `;
  document.getElementsByTagName('body')[0].appendChild(runHighlightScript);
  return dom;
};

const sanitise = str => str
  .replace(/`/g,"\\`")
  .replace(/"/g,"\\\"");

const convertMLtoRE = mlCode => new Promise((resolve, reject) => {
  const { code, stdout, stderr } = shell
    .exec(`echo "${sanitise(mlCode)}"`)
    .exec(`node_modules/.bin/bsrefmt --parse ml --print re `);
  if(code === 0) {
    resolve(stdout);
  } else {
    reject(stderr);
  }
}).catch(e => {
  logEcho(`echo "${sanitise(mlCode)}"`);
  return Promise.reject(e);
});

const folderOfManual = '../TheOCamlsystem4.06';
const folderOfManualInReason = `docs`;

const staggerArrayOfPromises = (chunkSize, items, processor) => {
  return chunk(items, chunkSize)
    .reduce((accm, chuckOfItemsToProcess) =>{
      return accm.then(
        (prev) => Promise.all(
          chuckOfItemsToProcess.map(processor)
        ).then(curr => flatten([prev,curr]))
      )
    }, Promise.resolve([]))
};

rmrfAsync(folderOfManualInReason)
  .then(() => fs.mkdirSync(folderOfManualInReason))
  .then(() => ncpAsync(folderOfManual, folderOfManualInReason))
  .then(() => Promise.all(
      fs.readdirSync(folderOfManualInReason)
        .filter(file => regexForExtension.exec(file).pop() === 'html')
        .map(file => `${folderOfManualInReason}/${file}`)
        .map(fileName =>
          JSDOM
            .fromFile(fileName)
            .then(injectHighlighter)
            .then(dom => [fileName, dom])
        )
    )
  )
  .then(files => staggerArrayOfPromises(
    1,
    files,
    ([fileName, dom]) => {
      logInfo(`Processing ${fileName}`);
      return Promise.all(
        [...findOCamlCodeElements(dom)]
          .map((ocamlCodeBlock, index, all) => {
            logInfo(`converting ${index + 1}/${all.length} in ${fileName}`);
            return convertMLtoRE(ocamlCodeBlock.textContent)
            .catch(e => {
                logError(`
              Failed ${index + 1}/${all.length} in ${fileName}:
${e}
                `);
                logCode(`
${mlCode}
                `);
                return mlCode;
            })
            .then(reCode => {
              ocamlCodeBlock.className += " re-input";
              ocamlCodeBlock.textContent = reCode;
            })
            .catch(mlCode => {
              ocamlCodeBlock.className += " re-failed-input";
            })
          })
      ).then(_ => {
        logInfo(`Writing ${fileName}`);
        return writeFileAsync(`${fileName}`, dom.serialize())
          .catch(e => {
            logError(`failed to write ${fileName}:${e}`);
          }).then(_ => {
            logSuccess(`Processed ${fileName}`);
          });
      });
  })
)
.then(_ => {
  logSuccess('Fin.');
}).catch(e => {
  logError(e);
});
