const psd = require('psd');
const filepath = './1-2-1.psd'
// 读取PSD文件
const file = psd.fromFile(filepath);
file.parse();
// 获取所有图层的树形结构
const descendants = file.tree().descendants().reverse();
const tree0 = file.tree().root();
const tree = tree0.subtree()
// 获取所有图层的数据
const layersData = Object.values(file.tree().export());
const dm =  file.tree().export().document

const outputFilePath = './output.png'

const validPsdLayers = Array.from(descendants).filter(item => {
  // 过滤非图层节点
  if (item.type !== 'group') {
    return false;
  }
  // 不可见的过滤掉
  if (!item.layer.visible) {
    return false;
  }
  // 宽高不正常的过滤掉
  if (item.width <= 0 || item.height <= 0) {
    return false;
  }
  return true;
});

// 获取图层树的根节点
const rootNode = file.tree();

// 生成图片
const generateIMG=(layer,count)=>{
  const outputFilePath = `./op${count}.png`
  psd.open(filepath).then(function (p) {
    console.log('图片生成成功',outputFilePath);
    // 读取生成的图片文件，转换为Base64编码
  return layer.saveAsPng(outputFilePath);
}).then(function () {
  console.log("Finished!");
});
}


// 遍历根节点的子图层，提取最外层的五个Group组
const outerGroups = [];
function isOuterGroup(layer) {
  if (!layer.isGroup()) {
    return false;
  }

  let parent = layer.parent;
  while (parent) {
    if (parent.isGroup()) {
      return false;
    }
    parent = parent.parent;
  }
  console.log(layer.depth(),' ',layer.name)
  return true;
}

let count = 0;
rootNode.descendants().forEach(layer => {
  // console.log(layer.depth())
  if (isOuterGroup(layer)) {
    outerGroups.push(layer);
  }
});
console.log(outerGroups.length)

// psd.open(filepath).then(function (p) {
//     // p.image.saveAsPng(outputFilePath);
//     console.log('图片生成成功',outputFilePath);
//     // 读取生成的图片文件，转换为Base64编码
 
// //   socket.emit('image', imageBase64);
//   return p.image.saveAsPng(outputFilePath);
// // return;
// }).then(function () {
//   const imageBase64 = fs.readFileSync(outputFilePath, { encoding: 'base64' });
//   console.log(imageBase64)
//   console.log("Finished!");
// });



// 生成HTML
function generateHTML(array) {
  let html = '';
  console.log(array.length);
  for (let i = 0; i < array.length; i++) {
    // console.log(array[i].layer.image);
    // if(array[i].layer.image) {
    //   const pngData = array[i].layer.image.toPng();
    //   const data = toBase64Sync(pngData);
    //   // html += embedToSVGImg(data, array[i].get('width'), array[i].get('height'), array[i])
    //   html += embedToImage(data, array[i].get('width'), array[i].get('height'), array[i])
      
    // } else {}
  }
  html+= `<canvas id="myCanvas" width="${dm.width}" height="${dm.height}" style="position:absolute;pointer-events:none;left:0;top:0"></canvas>`;
  html+= `<div id="container"></div>`
  return html;
}

// generateHTML(validPsdLayers)
