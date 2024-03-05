/*
 * @Author: zetawoo zetawoo@163.com
 * @Date: 2023-07-27 10:52:50
 * @LastEditTime: 2023-07-28 15:41:26
 * @LastEditors: zetawoo
 * @Description: 
 * @FilePath: \psd\index.js
 * GGUXD
 */
const PSD = require('psd');
// const psd = PSD.fromFile("./demo.psd");
const psdFile = './demo.psd';
const fs = require('fs');
const CircularJSON = require('circular-json');
// psd.parse();

// console.log(psd.tree().export());
// console.log(psd.tree().childrenAtPath('A/B/C')[0].export());

// You can also use promises syntax for opening and parsing
PSD.open(psdFile).then(function (psd) {
  console.log('PSD INFO');
  // console.log(psd);
  // console.log(psd.tree());
  // fs.writeFileSync('info.json', JSON.stringify(psd.tree().export()));
  const dt = psd.tree().export();
  const aaa = dt.children[11];
  //.layer.image.saveAsPng
  // console.log(aaa.layer);
  // aaa.image.saveAsPng('./output2.png').then(function () {
  //   console.log('Exported!');
  // });

  let descendants = psd.tree().descendants();
  console.log(descendants);
  // fs.writeFileSync('info2.json', CircularJSON.stringify(descendants));
  console.log(descendants.length);
  // console.log(descendants[11]);

  // descendants[500].layer.image.saveAsPng('./output2.png');
  // for(let i=0;i<descendants.length;i++){
  //   const dt=descendants[i];
  //   if(dt){
  //     dt.layer.image.saveAsPng(`./png/PNG_${i}.png`);
  //   }

  // }
  let num = 1;
  const searchForImage = (node) => {
    if (node && node.hasChildren()) {
      searchForImage(node.childeren);
    } else if (node) {
      node.layer.image.saveAsPng(`./png2/${num}.png`);
      num++;
    }
  };

  psd.tree().descendants().forEach((node) => {
    searchForImage(node);
  });


  return psd.image.saveAsPng('./output.png');
}).then(function () {
  console.log("Finished!");
});


// png = psd.image.toPng(); // get PNG object
// psd.image.saveAsPng('path/to/output.png').then(function () {
//   console.log('Exported!');
// });


