const refmt = require('refmt');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

const regexForExtension = /(?:\.([^.]+))?$/;
const regexForFileExample = /\s[a-zA-Z]+\.ml\s/gm;

const findOCamlCodeElements = dom => [].slice.call(dom.window.document.querySelectorAll(".caml-input"));
const findUnmarkedPreNodes = dom =>
  [].slice.call(dom.window.document.querySelectorAll("pre"))
    .filter(preNode => regexForFileExample.exec(preNode.textContent).length > 0);
const injectHighlighter = dom => {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = '//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js';

  var style = document.createElement('style');
  style.rel = 'stylesheet';
  style.href = '//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css';

  document.getElementsByTagName('head')[0].appendChild(style);
  document.getElementsByTagName('head')[0].appendChild(script);
  return dom;
};

const folderOfBook = '../TheOCamlsystem4.06';

Promise.all(
  fs.readdirSync(folderOfBook)
    .filter(file => regexForExtension.exec(file).pop() === 'html')
    .map(file => `${folderOfBook}/${file}`)
    .map(fileName =>
      JSDOM
        .fromFile(fileName)
        .then(dom => [fileName, dom])
        .then(injectHighlighter)
    )
).then(files =>
  Promise.all(
    files.map(([fileName, dom]) => {
      console.log(`Processing ${fileName}`);
      [...findOCamlCodeElements(dom), ...findUnmarkedPreNodes(dom)]
        .forEach(ocamlCodeBlock => {
          ocamlCodeBlock.className += " re-input";
          ocamlCodeBlock.textContent = refmt(ocamlCodeBlock.textContent, 'ML');
        });
      console.log(`Writing ${fileName}`);
      return writeFileAsync(`${fileName}`, dom.serialize());
    })
  )
).then(_ => {
  console.log('written');
}).catch(e => {
  console.log(e);
});
// JSDOM.fromFile("../TheOCamlsystem4.06/moduleexamples.html", {}).then(dom => {
//   [].slice.call(dom.window.document.querySelectorAll(".caml-input"))
//     .forEach(ocaml => {
//       // console.log("OCaml");
//       // console.log(ocaml.textContent);
//       // console.log("Reason");
//       // console.log(refmt(ocaml.textContent, 'ML'));
//       ocaml.textContent = refmt(ocaml.textContent, 'ML');
//     });
//   fs.writeFile('../TheOCamlsystem4.06/moduleexamples.re.html', dom.serialize(), (err) => {
//     // throws an error, you could also catch it here
//     if (err) throw err;

//     // success case, the file was saved
//     console.log('saved!');
//   });
// });
// fs.readFile('../TheOCamlsystem4.06/moduleexamples.html', 'utf8', function (err, data) {
//   if (err) {
//     return console.log(err);
//   }
//   const dom = new JSDOM(data);
//   [].slice.call(dom.window.document.querySelectorAll(".caml-input"))
//     .forEach(ocaml => {
//       // console.log("OCaml");
//       // console.log(ocaml.textContent);
//       // console.log("Reason");
//       // console.log(refmt(ocaml.textContent, 'ML'));
//       ocaml.textContent = refmt(ocaml.textContent, 'ML');
//     });

  // fs.writeFile('../TheOCamlsystem4.06/moduleexamples.re.html', `${dom.innerHTML}`, (err) => {
  //   // throws an error, you could also catch it here
  //   if (err) throw err;

  //   // success case, the file was saved
  //   console.log('saved!');
  // });
//   // const ocaml = dom.window.document.querySelectorAll(".caml-input").textContent;
//   // console.log("OCaml");
//   // console.log(ocaml);
//   // console.log("Reason");
//   // console.log(refmt(ocaml, 'ML'));
// });