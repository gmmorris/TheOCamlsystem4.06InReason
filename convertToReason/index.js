const refmt = require('refmt');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

const regexForExtension = /(?:\.([^.]+))?$/;

const findOCamlCodeElements = dom => [].slice.call(dom.window.document.querySelectorAll(".caml-input"));

const folderOfBook = '../TheOCamlsystem4.06';

Promise.all(
  fs.readdirSync(folderOfBook)
    .filter(file => regexForExtension.exec(file).pop() === 'html')
    .map(file => `${folderOfBook}/${file}`)
    .map(file =>
      JSDOM
        .fromFile(file)
        .then(dom => [file, dom])
    )
).then(files =>
  Promise.all(
    files.map(([file, dom]) => {
      console.log(`Processing ${file}`);
      findOCamlCodeElements(dom)
        .forEach(ocamlCodeBlock => {
          ocamlCodeBlock.textContent = refmt(ocamlCodeBlock.textContent, 'ML');
        });
      console.log(`Writing ${file}`);
      return writeFileAsync(`${file}`, dom.serialize());
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