const refmt = require('refmt');
const jsdom = require('jsdom');
// const nrc = require('node-run-cmd');
const shell = require('shelljs');
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

const { JSDOM } = jsdom;

const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

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

const convertMLtoRE = mlCode => new Promise((resolve, reject) => {
  shell.exec(`echo "${mlCode}"`).exec(`node_modules/.bin/bsrefmt --parse ml --print re `, function(code, stdout, stderr) {
    if(code === 0) {
      resolve(stdout);
    } else {
      reject(stderr);
    }
    // console.log('Exit code:', code);
    // console.log('Program output:', stdout);
    // console.log('Program stderr:', stderr);
  });
});

const folderOfManual = '../TheOCamlsystem4.06';
const folderOfManualInReason = `${folderOfManual}.reason`;

fs.mkdirSync(folderOfManualInReason);
ncpAsync(folderOfManual, folderOfManualInReason)
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
  ).then(files =>
    Promise.all(
      files.map(([fileName, dom]) => {
        console.log(`Processing ${fileName}`);
        return Promise.all(
          [...findOCamlCodeElements(dom)]
          .map(ocamlCodeBlock =>
            convertMLtoRE(ocamlCodeBlock.textContent)
            .then(reCode => {
              ocamlCodeBlock.className += " re-input";
              ocamlCodeBlock.textContent = reCode;
            })
          )
        ).then(_ => {
          console.log(`Writing ${fileName}`);
          return writeFileAsync(`${fileName}`, dom.serialize());
        });
      })
    )
  ))
  .then(_ => {
    console.log('written');
  }).catch(e => {
    console.log(e);
  });
