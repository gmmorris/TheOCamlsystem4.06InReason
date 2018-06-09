The OCaml system release 4.06 in ReasonML
===============================

A clone of the original OCaml system manual written by Xavier Leroy, Damien Doligez, Alain Frisch, Jacques Garrigue, Didier Rémy and Jérôme Vouillon wit hall code examples written in ReasonML istead of OCaml.
All original rights their and I am simply trying to make the docs more accesible to the ReasonML community.

The original OCaml docs are on [caml.inria.fr ](https://caml.inria.fr/pub/docs/manual-ocaml/index.html)

# Why
I have been trying to learn ReasonML and in order to understand the ecosystem properly I felt I should understand OCaml and so I have been refering to this manual quite alot.
The one annoyance I have had is that going back and forth converting the OCaml code to ReasonML code has been a little annoying and the Chrome extsnions didn't seem to do well on these pages.
To rectify this I wrote a small script which creates a copy of the docs and converts all the code snippets inside of it.

# How can I contribute?
If you find a section of the code hasn't been converted properly (which is likely as this has been done programmatically) please do correct it and and issue a PR.
Please *do not* change the *docs/* folder but rather make the correction in the _./convertToReason/index.js_ script or the _./TheOCamlsystem4.06/_ documentation, and then regenerate the docs folder by running:
```bash
cd ./convertToReason
npm i
node ./index.js
```

This will rebuild the docs and allow you to commit and make a Pull Request. :)

