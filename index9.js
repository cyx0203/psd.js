const psd = require('psd');
const fs = require('fs');
const Konva = require('konva').default
const { Server } = require('socket.io')
const { createServer } = require('http')
const {
  parsePath,
  toPath,
  getFillColor
} = require('./path')
// 读取PSD文件
const file = psd.fromFile('./线上-测试.psd');
file.parse();

// psd.open("./demo3.psd").then(function (psd) {
//   return psd.image.saveAsPng('./index8.png');
// }).then(function () {
//   console.log("Finished!");
// });


// 获取所有图层的树形结构
const descendants = file.tree().descendants().reverse();
const tree0 = file.tree().root();
const tree = tree0.subtree()
// 获取所有图层的数据
const layersData = Object.values(file.tree().export());
const dm =  file.tree().export().document
// psd.open('./demo2.psd').then(ppsd=>{
//   const parent = ppsd.tree().children()
//   parent.forEach(child=>console.log(child.layer.image.toPng()))
// })

// 定义一个递归函数，用于将树形结构和图层数据进行关联
function associateData(node, layersData) {
  // if(node.layer.image.toBase64()) console.log(node.layer.image.toBase64());
  // 获取当前节点的图层名称
  const layerName = node.layer.name;
  const layerType = node.layer.layerType;
  // console.log(layerName)
  // 获取当前节点的图层数据
  const layerData = layersData.find(data => data.name === layerName && data.type === layerType);

  // 关联当前节点的数据
  node.data = layerData;

  // 获取子节点的数组
  // console.log(Object.values(node.children()))
  const children = Object.values(node.children() || {});

  // 遍历子节点进行递归关联
  children.forEach(child => associateData(child, layersData));
}

// 对每个图层的树形结构进行关联处理
// tree.forEach(node => associateData(node, layersData));
associateData(tree0, layersData)


const validPsdLayers = Array.from(descendants).filter(item => {
  // 过滤非图层节点
  if (item.type !== 'layer') {
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


/**
 * 获取贝塞尔曲线路径，可能存在多条路径，因此返回二维数组
 */
// const getBezierPaths = (vectorPaths) => {
//   const bezierPaths = [];​
//   let bezierPath = [];​
//   vectorPaths.forEach(item => {
//     // numPoints表示接下来的曲线节点数量，可以借此分割不同的路径
//     if (item.numPoints && item.numPoints > 0) {
//       bezierPath = [];
//       bezierPaths.push(bezierPath);
//       return;
//     }​
//     if (!!item.anchor && !!item.leaving && !!item.preceding) {
//       bezierPath.push(item);
//     }
//   });​
//   return bezierPaths;
// };

// /**
//  * 无符号浮点数转化为有符号浮点数
//  */
// const signed = (n) => {
//   let num = n;​
//   if (num > 0x8f) {
//     num = num - 0xff - 1;
//   }
//   return num;
// };

// /**
//  * 减去了图层的left/top值，使其相对svg元素定位
//  */
// const transformPosition = (point) => {
//   return {
//     x: signed(point.horiz) * canvasW - left,
//     y: signed(point.vert) * canvasH - top
//   };
// };

const embedToSVG=(paths,fill)=>{
  return `<?xml version="1.0" encoding="UTF-8"?>
  <!-- generated bounding_y lst-postman -->
  <svg version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    viewBox="0 0 ${dm.width} ${dm.height}"
    enable-background="new 0 0 ${dm.width} ${dm.height}"
    xml:space="preserve"
  >
   ${toPath(paths,fill)}
 </svg>`
}

const embedToSVGImg=(href, width, height, item)=>{
    const {
      top,
      left,
      opacity,
      mask,
      name,
      visible
    } = item.export()
  return `
  <?xml version="1.0" encoding="UTF-8"?>
  <svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  x="${left}" y="${top}"
  width="${width}" height="${height}"
  viewBox="0 0 ${width} ${height}"
  enable-background="new 0 0 ${width} ${height}"
  >
  <image className="${name}" xlink:href="${href}" width="${width}" height="${height}"  />
  </svg>`
}

// 生成HTML
function generateHTML2(array) {
  let html = '';
  for (let i = 0; i < array.length; i++) {
    if(array[i].layer.image) {
      const pngData = array[i].layer.image.toPng();
      const data = toBase64Sync(pngData);
      // html += embedToSVGImg(data, array[i].get('width'), array[i].get('height'), array[i])
      html += embedToImage(data, array[i].get('width'), array[i].get('height'), array[i])
    }
    else if (array[i].get('vectorMask')) {
      const vectorMask = array[i].get('vectorMask')
      vectorMask.parse()

      const paths = vectorMask.export().paths;

      // console.log(paths)
      const convertedPath = []
      paths.forEach(path => {
        // 转换控制点的位置
        // 这里的 document 为psd.js导出的psd文档对象
        const {
          recordType,
          numPoints
        } = path;
        if (path.preceding) {
          const {
            preceding,
            anchor,
            leaving
          } = parsePath(path, dm); // 控制点的位置转换成了像素位置
          convertedPath.push({
            preceding,
            anchor,
            leaving
          });
        }
      });

      // html += embedToSVG(convertedPath,getFillColor(array[i]))
    } else {}
  }
  html+= `<canvas id="myCanvas" width="${dm.width}" height="${dm.height}" style="position:absolute;pointer-events:none;left:0;top:0"></canvas>`;
  html+= `<div id="container"></div>`
  return html;
}

// 现在每个图层节点都有关联的图层数据
// console.log(tree);
function generateHTML(item) { //data
  // if(item.isLayer()) console.log(item.export().image);
  let html = '';
  // 遍历数据
  // data.forEach((item) => {
  // 检查节点类型
  if (item.isGroup()) {
    // 如果是组节点，生成一个<div>标签
    // html += `<div  style="position: absolute; top: ${item.top/2}px; left: ${item.left/2}px; width: ${item.width/2}px; height: ${item.height/2}px; background-color: ${item.get('backgroundColor')?item.get('backgroundColor'):'#00ddf'};">`;
    html += `<div>`
    // html += '</div>';
    // 递归生成组内的子元素
    // html += `<div style="position: relative"></div>`;
    // item.children().forEach((i)=>{html += generateHTML(i)}) // html += generateHTML(item.children());
    for (let i = 0; i < item.children().length; i++) {
      html += generateHTML(item.children()[i])
    }
    html += '</div>';

  }
  // else if (item.isShape()) {
  //     // 如果是形状节点，生成一个<div>标签
  //     html += `<div style="position: absolute; top: ${item.top}px; left: ${item.left}px; width: ${item.width}px; height: ${item.height}px; background-color: ${item.get('fillColor')};"></div>`;
  // }
  else if (item.isLayer()) {

    if (item.export().image) {
      // console.log(item.layer.image)
      // if (!item.get('typeTool')) { // 过滤文字型图片图层
        // console.log(item.layer.image.obj)
        // fs.writeFile('./info2.txt', item.layer.image, (err) => {
        //   if (err) throw err;
        //   console.log('image!');
        // });
        const pngData = item.layer.image.toPng();
        const data = toBase64Sync(pngData);
        html += embedToImage(data, item.get('width'), item.get('height'), item)
      // }
    }

    // if (item.export().text) {
    //   // console.log(item.export().text)
    //   const text = item.export().text
    //   // html += `<div style="position: relative">`;

    //   // html += generateSvg(item.export(),text);
    //   html += embedToText(text, item);
    //   // html += `</svg>`;

    //   // html += '</div>';
    // }

    if (item.get('vectorMask')) {
      const vectorMask = item.get('vectorMask');
      if (vectorMask) {
        vectorMask.parse();
        const paths = vectorMask.export().paths;

        // console.log(paths)
        const convertedPath = []
        paths.forEach(path => {
          // console.log(path)
          // 转换控制点的位置
          // 这里的 document 为psd.js导出的psd文档对象
          const {
            recordType,
            numPoints
          } = path;
          if (path.preceding) {
            const {
              preceding,
              anchor,
              leaving
            } = parsePath(path, dm); // 控制点的位置转换成了像素位置
            convertedPath.push({
              preceding,
              anchor,
              leaving
            });
          }

        });
        // html += embedToSVG(convertedPath,getFillColor(item))
      }
    }
  } else {
    for (let i = 0; i < item.children().length; i++) {
      html += generateHTML(item.children()[i])
    }
    // item.children().forEach((i)=>{html += generateHTML(i);})
  }
  // });

  return html;
}


// 图片处理
// 关键步骤：
// [1] 通过pack方法将图片数据转成stream对象
// [2] 基于stream的data事件，获取流数据
// [3] 通过Buffer将流数据转换成Base64字符串
function toBase64(image) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    image.pack(); // [1]
    image.on('data', (chunk) => {
      chunks.push(chunk); // [2]
    });
    image.on('end', () => {
      resolve(`data:image/png;base64,${Buffer.concat(chunks).toString('base64')}`); // [3]
    });
    image.on('error', (err) => {
      reject(err);
    });
  });
}

const deasync = require('deasync');
const {
  SSL_OP_SSLEAY_080_CLIENT_DH_BUG
} = require('constants');
const { index } = require('cheerio/lib/api/traversing');

function toBase64Sync(image) {
  const chunks = [];
  let result = null;

  try {
    image.pack(); // [1]
  } catch {
    console.log('[1]')
    return;
  }

  try {
    image.on('data', (chunk) => {
      chunks.push(chunk); // [2]
    });
  } catch {
    console.log('[2]')
    return;
  }

  try {
    image.on('end', () => {
      result = `data:image/png;base64,${Buffer.concat(chunks).toString('base64')}`; // [3]
    });
  } catch {
    console.log('[3]')
    return;
  }


  image.on('error', (err) => {
    throw err;
  });

  // 使用 deasync 来同步等待结果
  deasync.loopWhile(() => result === null);

  return result;

}

var focusEle = ""
var imageData = ""
var ctx = ""
const enterElement = function (e) {
  // document.getElementById(id).style.border = 'solid 1px'
  // const style = document.getElementById(id).style
  // const bounding = document.getElementById(id).getBoundingClientRect()
  // const canvas = document.getElementById('myCanvas')
  // ctx = canvas.getContext('2d');
  // imageData = ctx.getImageData(0,0,canvas.width,canvas.height); 

  const ele = e.target
  ele.classList.add('hoverEle');

  const canvas = document.getElementById('myCanvas')
  ctx = canvas.getContext('2d');
  const bounding = ele.getBoundingClientRect()
  const focusBounding = focusEle.getBoundingClientRect()
  imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
  
  const bounding_x = bounding.x;
  const bounding_x_width = bounding.x+bounding.width;
  const bounding_x_width_half = bounding.x+bounding.width/2;
  const bounding_y = bounding.y;
  const bounding_y_height = bounding.y+bounding.height;
  const bounding_y_height_half = bounding.y+bounding.height/2;

  const focusBounding_x = focusBounding.x;
  const focusBounding_x_width = focusBounding.x+focusBounding.width;
  const focusBounding_x_width_half = focusBounding.x+focusBounding.width/2;
  const focusBounding_y = focusBounding.y;
  const focusBounding_y_height = focusBounding.y+focusBounding.height;
  const focusBounding_y_height_half = focusBounding.y+focusBounding.height/2;
  // 正上侧，包含整体小于和超出当前元素
  if((bounding_y_height<focusBounding_y&&bounding_x_width<=focusBounding_x_width&&bounding_x>=focusBounding_x)||(bounding_y_height<focusBounding_y&&bounding_x<=focusBounding_x&&bounding_x_width>=focusBounding_x_width)){

    // 上小下大
    if(bounding.width<focusBounding.width) {
      ctx.beginPath()
      ctx.strokeStyle = 'red'
      ctx.moveTo(bounding_x_width_half,bounding_y_height),
      ctx.lineTo(bounding_x_width_half,focusBounding_y)
      // 向左右延申
      if(bounding_x-focusBounding_x!==0){ //排除边界
        ctx.moveTo(bounding_x,bounding_y_height_half)
        ctx.lineTo(focusBounding_x,bounding_y_height_half)
      }
      if(focusBounding_x_width-bounding_x_width!==0){
        ctx.moveTo(bounding_x_width,bounding_y_height_half)
        ctx.lineTo(focusBounding_x_width,bounding_y_height_half)
      }
      ctx.stroke();

      //向下延申
      ctx.beginPath()
      ctx.strokeStyle = 'blue'
      ctx.setLineDash([5,5])
      if(bounding_x-focusBounding_x!==0){ //排除边界
        ctx.moveTo(focusBounding_x,bounding_y_height_half)
        ctx.lineTo(focusBounding_x,focusBounding_y)
      }
      if(focusBounding_x_width-bounding_x_width!==0){
        ctx.moveTo(focusBounding_x_width,bounding_y_height_half)
        ctx.lineTo(focusBounding_x_width,focusBounding_y)
      }
      ctx.stroke();

      // 方块
    const txt = `${Math.floor(focusBounding_y-bounding_y_height)}px`
    const txtL = `${Math.floor(bounding_x-focusBounding_x)}px`
    const txtR = `${Math.floor(focusBounding_x_width-bounding_x_width)}px`
    const mesureTxt = ctx.measureText(txt)
    // console.log(ctx.measureText(txt))
    ctx.beginPath();
    ctx.setLineDash([])
    ctx.fillStyle = 'red'
    ctx.fillRect(bounding_x_width_half,(focusBounding_y+bounding_y_height)/2-5,Math.floor(mesureTxt.width)+5,30)
    ctx.stroke()

    // 测距文字
    ctx.beginPath()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'hanging'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    ctx.fillText(txt,bounding_x_width_half,(focusBounding_y+bounding_y_height)/2)
    if(bounding_x-focusBounding_x!==0){ //排除边界
      ctx.fillText(txtL,(focusBounding_x+bounding_x)/2,bounding_y_height_half)
    }
    if(focusBounding_x_width-bounding_x_width!==0){
      ctx.fillText(txtR,(focusBounding_x_width+bounding_x_width)/2,bounding_y_height_half)
    }
    ctx.stroke()
    }
    // 上大下小
    else if(bounding.width>focusBounding.width){
      ctx.beginPath()
      ctx.strokeStyle = 'red'
      ctx.setLineDash([])
      ctx.moveTo(focusBounding_x_width_half,bounding_y_height),
      ctx.lineTo(focusBounding_x_width_half,focusBounding_y)
    
      // 向左右延申
      if(focusBounding_x-bounding_x!==0){ //排除边界
        ctx.moveTo(focusBounding_x,focusBounding_y_height_half)
        ctx.lineTo(bounding_x,focusBounding_y_height_half)
      }
      if(bounding_x_width-focusBounding_x_width!==0){
        ctx.moveTo(focusBounding_x_width,focusBounding_y_height_half)
        ctx.lineTo(bounding_x_width,focusBounding_y_height_half)
      }
    ctx.stroke();

    //向下延申
    ctx.beginPath()
    ctx.strokeStyle = 'blue'
    ctx.setLineDash([5,5])
    if(focusBounding_x-bounding_x!==0){ //排除边界
    ctx.moveTo(bounding_x,focusBounding_y_height_half)
    ctx.lineTo(bounding_x,bounding_y_height)
    }
    if(bounding_x_width-focusBounding_x_width!==0){
    ctx.moveTo(bounding_x_width,focusBounding_y_height_half)
    ctx.lineTo(bounding_x_width,bounding_y_height)
    }
    ctx.stroke();
    
    const txt = `${Math.floor(focusBounding_y-bounding_y_height)}px`
    const txtL = `${Math.floor(focusBounding_x-bounding_x)}px`
    const txtR = `${Math.floor(bounding_x_width-focusBounding_x_width)}px`
    const mesureTxt = ctx.measureText(txt)
    // console.log(ctx.measureText(txt))
    ctx.beginPath();
    ctx.fillStyle = 'red'
    ctx.fillRect(focusBounding_x_width_half,(focusBounding_y+bounding_y_height)/2-5,Math.floor(mesureTxt.width)+5,30)
    ctx.stroke()

    ctx.beginPath()
    ctx.setLineDash([])
    ctx.textAlign = 'left'
    ctx.textBaseline = 'hanging'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    ctx.fillText(txt,focusBounding_x_width_half,(focusBounding_y+bounding_y_height)/2)
    if(focusBounding_x-bounding_x!==0){ //排除边界
      ctx.fillText(txtL,(focusBounding_x+bounding_x)/2,focusBounding_y_height_half)
    }
    if(focusBounding_x_width-bounding_x_width!==0){
      ctx.fillText(txtR,(focusBounding_x_width+bounding_x_width)/2,focusBounding_y_height_half)
    }
    ctx.stroke()
    }
    // 大小相同
    else {
      ctx.beginPath()
      ctx.strokeStyle = 'red'
      ctx.moveTo(bounding_x_width_half,bounding_y_height),
      ctx.lineTo(bounding_x_width_half,focusBounding_y)
      ctx.stroke();

      // 方块
    const txt = `${Math.floor(focusBounding_y-bounding_y_height)}px`
    const mesureTxt = ctx.measureText(txt)
    ctx.beginPath();
    ctx.fillStyle = 'red'
    ctx.fillRect(bounding_x_width_half,(focusBounding_y+bounding_y_height)/2-5,Math.floor(mesureTxt.width)+5,30)
    ctx.stroke()

    // 测距文字
    ctx.beginPath()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'hanging'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'white'
    ctx.fillText(txt,bounding_x_width_half,(focusBounding_y+bounding_y_height)/2)
    ctx.stroke()
    }
  }
  // 左下角
  else if(bounding.y>focusBounding.y+focusBounding.height && bounding.x+bounding.width<focusBounding.x) {
    ctx.beginPath();
    ctx.strokeStyle = 'blue'
    ctx.moveTo(bounding.x+bounding.width,bounding.y)
    ctx.lineTo(bounding.x+bounding.width,focusBounding.y+focusBounding.height/2)
    ctx.moveTo(bounding.x+bounding.width,bounding.y)
    ctx.lineTo(focusBounding.x+focusBounding.width/2,bounding.y)
    ctx.setLineDash([5,5])
    ctx.stroke();

    ctx.beginPath();
    // x 轴线
    ctx.setLineDash([])
    ctx.moveTo(focusBounding.x,focusBounding.y+focusBounding.height/2);
    ctx.lineTo(bounding.x+bounding.width,focusBounding.y+focusBounding.height/2);
    // // y 轴线
    ctx.moveTo(focusBounding.x+focusBounding.width/2,focusBounding.y+focusBounding.height);
    ctx.lineTo(focusBounding.x+focusBounding.width/2,bounding.y);
    ctx.strokeStyle = 'red'
    ctx.stroke();
    
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    ctx.fillText(`y:${Math.floor(bounding.y-(focusBounding.y+focusBounding.height))}px`,(focusBounding.x+focusBounding.width/2),(focusBounding.y+focusBounding.height+bounding.y)/2)
    ctx.textAlign = 'center'
    ctx.fillText(`x:${Math.floor(focusBounding.x-(bounding.x+bounding.width))}px`,(focusBounding.x+bounding.x+bounding.width)/2,(focusBounding.y+focusBounding.height/2))
  }
  // 右侧
  else if((bounding_x>focusBounding_x_width&&bounding_y>=focusBounding_y&&bounding_y_height<=focusBounding_y_height)||(bounding_x>focusBounding_x_width&&bounding_y<=focusBounding_y&&bounding_y_height>=focusBounding_y_height)){
    // 大小一致
    if(bounding.height===focusBounding.height) {
      var arrow = new Konva.Arrow({
        x: stage.width() / 4,
        y: stage.height() / 4,
        points: [0, 0, dm.width / 2, dm.height / 2],
        pointerLength: 20,
        pointerWidth: 20,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 4
      });

      // add the shape to the layer
      layer.add(arrow);

      // add the layer to the stage
      stage.add(layer);
    }
    // ctx.beginPath();
    // // x 轴线
    // bounding.height<focusBounding.height?
    // (
    //   ctx.moveTo(focusBounding_x_width,bounding_y_height_half),
    //   ctx.lineTo(bounding_x,bounding_y_height_half)
    // ):(
    //   ctx.moveTo(focusBounding_x_width,focusBounding_y_height_half),
    //   ctx.lineTo(bounding_x,focusBounding_y_height_half)
    // )
    
    // ctx.strokeStyle = 'red'
    // ctx.stroke();
    
    // ctx.textAlign = 'center'
    // ctx.textBaseline = 'bottom'
    // ctx.font = 'normal 20px 微软雅黑'
    // ctx.fillStyle = 'red'
    // bounding.height<focusBounding.height?
    // ctx.fillText(`x:${Math.floor(bounding_x-focusBounding_x_width)}px`,(bounding_x+focusBounding_x_width)/2,bounding_y_height_half)
    // :ctx.fillText(`x:${Math.floor(bounding_x-focusBounding_x_width)}px`,(bounding_x+focusBounding_x_width)/2,focusBounding_y_height_half)
  }
  // 下侧-新
  else if((bounding_y>focusBounding_y_height&&bounding_x_width<=focusBounding_x_width&&bounding_x>=focusBounding_x)||(bounding_y>focusBounding_y_height&&bounding_x<=focusBounding_x&&bounding_x_width>=focusBounding_x_width)){
    // 上大下小
    if(bounding.width<focusBounding.width) {
      ctx.beginPath()
      ctx.strokeStyle = 'red'
      ctx.moveTo(bounding_x_width_half,bounding_y),
      ctx.lineTo(bounding_x_width_half,focusBounding_y_height)
      // 向左右延申
      if(bounding_x-focusBounding_x!==0){ //排除边界
        ctx.moveTo(bounding_x,bounding_y_height_half)
        ctx.lineTo(focusBounding_x,bounding_y_height_half)
      }
      if(focusBounding_x_width-bounding_x_width!==0){
        ctx.moveTo(bounding_x_width,bounding_y_height_half)
        ctx.lineTo(focusBounding_x_width,bounding_y_height_half)
      }
      ctx.stroke();

      //向下延申
      ctx.beginPath()
      ctx.strokeStyle = 'blue'
      ctx.setLineDash([5,5])
      if(bounding_x-focusBounding_x!==0){ //排除边界
        ctx.moveTo(focusBounding_x,bounding_y_height_half)
        ctx.lineTo(focusBounding_x,focusBounding_y)
      }
      if(focusBounding_x_width-bounding_x_width!==0){
        ctx.moveTo(focusBounding_x_width,bounding_y_height_half)
        ctx.lineTo(focusBounding_x_width,focusBounding_y)
      }
      ctx.stroke();

      // 方块
    const txt = `${Math.floor(bounding_y-focusBounding_y_height)}px`
    const txtL = `${Math.floor(bounding_x-focusBounding_x)}px`
    const txtR = `${Math.floor(focusBounding_x_width-bounding_x_width)}px`
    const mesureTxt = ctx.measureText(txt)
    // console.log(ctx.measureText(txt))
    // ctx.beginPath();
    // ctx.fillStyle = 'red'
    // ctx.fillRect(bounding_x_width_half,(focusBounding_y+bounding_y_height)/2-5,Math.floor(mesureTxt.width)+5,30)
    // ctx.stroke()

    // 测距文字
    ctx.beginPath()
    ctx.setLineDash([])
    ctx.textAlign = 'left'
    ctx.textBaseline = 'hanging'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    ctx.fillText(txt,bounding_x_width_half,(bounding_y+focusBounding_y_height)/2)
    if(bounding_x-focusBounding_x!==0){ //排除边界
      ctx.fillText(txtL,(focusBounding_x+bounding_x)/2,bounding_y_height_half)
    }
    if(focusBounding_x_width-bounding_x_width!==0){
      ctx.fillText(txtR,(focusBounding_x_width+bounding_x_width)/2,bounding_y_height_half)
    }
    ctx.stroke()
    }
    // 上小下大
    else if(bounding.width>focusBounding.width){
      ctx.beginPath()
      ctx.strokeStyle = 'red'
      ctx.setLineDash([])
      ctx.moveTo(focusBounding_x_width_half,bounding_y),
      ctx.lineTo(focusBounding_x_width_half,focusBounding_y_height)
    
      // 向左右延申
      if(focusBounding_x-bounding_x!==0){ //排除边界
        ctx.moveTo(focusBounding_x,focusBounding_y_height_half)
        ctx.lineTo(bounding_x,focusBounding_y_height_half)
      }
      if(bounding_x_width-focusBounding_x_width!==0){
        ctx.moveTo(focusBounding_x_width,focusBounding_y_height_half)
        ctx.lineTo(bounding_x_width,focusBounding_y_height_half)
      }
    ctx.stroke();

    //向下延申
    ctx.beginPath()
    ctx.strokeStyle = 'blue'
    ctx.setLineDash([5,5])
    if(focusBounding_x-bounding_x!==0){ //排除边界
    ctx.moveTo(bounding_x,focusBounding_y_height_half)
    ctx.lineTo(bounding_x,bounding_y_height)
    }
    if(bounding_x_width-focusBounding_x_width!==0){
    ctx.moveTo(bounding_x_width,focusBounding_y_height_half)
    ctx.lineTo(bounding_x_width,bounding_y_height)
    }
    ctx.stroke();
    
    const txt = `${Math.floor(bounding_y-focusBounding_y_height)}px`
    const txtL = `${Math.floor(focusBounding_x-bounding_x)}px`
    const txtR = `${Math.floor(bounding_x_width-focusBounding_x_width)}px`
    const mesureTxt = ctx.measureText(txt)
    // console.log(ctx.measureText(txt))
    // ctx.beginPath();
    // ctx.fillStyle = 'red'
    // ctx.fillRect(focusBounding_x_width_half,(focusBounding_y+bounding_y_height)/2-5,Math.floor(mesureTxt.width)+5,30)
    // ctx.stroke()

    ctx.beginPath()
    ctx.setLineDash([])
    ctx.textAlign = 'left'
    ctx.textBaseline = 'hanging'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    ctx.fillText(txt,focusBounding_x_width_half,(bounding_y+focusBounding_y_height)/2)
    if(focusBounding_x-bounding_x!==0){ //排除边界
      ctx.fillText(txtL,(focusBounding_x+bounding_x)/2,focusBounding_y_height_half)
    }
    if(focusBounding_x_width-bounding_x_width!==0){
      ctx.fillText(txtR,(focusBounding_x_width+bounding_x_width)/2,focusBounding_y_height_half)
    }
    ctx.stroke()
    }
    // 大小相同
    else {
      ctx.beginPath()
      ctx.strokeStyle = 'red'
      ctx.moveTo(focusBounding_x_width_half,focusBounding_y_height),
      ctx.lineTo(focusBounding_x_width_half,bounding_y)
      ctx.stroke();

      // 方块
    const txt = `${Math.floor(bounding_y-focusBounding_y_height)}px`
    const mesureTxt = ctx.measureText(txt)
    // ctx.beginPath();
    // ctx.fillStyle = 'red'
    // ctx.fillRect(bounding_x_width_half,(focusBounding_y+bounding_y_height)/2-5,Math.floor(mesureTxt.width)+5,30)
    // ctx.stroke()

    // 测距文字
    ctx.beginPath()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'hanging'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    ctx.fillText(txt,bounding_x_width_half,(bounding_y+focusBounding_y_height)/2)
    ctx.stroke()
    }
  }
  // 左侧
  else if((bounding_x_width<focusBounding_x&&bounding_y>=focusBounding_y&&bounding_y_height<=focusBounding_y_height)||(bounding_x_width<focusBounding_x&&bounding_y<=focusBounding_y&&bounding_y_height>=focusBounding_y_height)){
    // 左小右大
    if(bounding.height<focusBounding.height) {
      ctx.beginPath();
      ctx.strokeStyle = 'red'
      ctx.moveTo(focusBounding_x,bounding_y_height_half);
      ctx.lineTo(bounding_x_width,bounding_y_height_half);
      ctx.stroke();
      // 向上下延申
      if(bounding_x-focusBounding_x!==0){ //排除边界
        ctx.moveTo(bounding_x,bounding_y_height_half)
        ctx.lineTo(focusBounding_x,bounding_y_height_half)
      }
      if(focusBounding_x_width-bounding_x_width!==0){
        ctx.moveTo(bounding_x_width,bounding_y_height_half)
        ctx.lineTo(focusBounding_x_width,bounding_y_height_half)
      }
      ctx.stroke();

      //向右延申
      ctx.beginPath()
      ctx.strokeStyle = 'blue'
      ctx.setLineDash([5,5])
      if(bounding_x-focusBounding_x!==0){ //排除边界
        ctx.moveTo(focusBounding_x,bounding_y_height_half)
        ctx.lineTo(focusBounding_x,focusBounding_y)
      }
      if(focusBounding_x_width-bounding_x_width!==0){
        ctx.moveTo(focusBounding_x_width,bounding_y_height_half)
        ctx.lineTo(focusBounding_x_width,focusBounding_y)
      }
      ctx.stroke();

      // 方块
    const txt = `${Math.floor(bounding_y-focusBounding_y_height)}px`
    const txtL = `${Math.floor(bounding_x-focusBounding_x)}px`
    const txtR = `${Math.floor(focusBounding_x_width-bounding_x_width)}px`
    const mesureTxt = ctx.measureText(txt)

    // 测距文字
    ctx.beginPath()
    ctx.setLineDash([])
    ctx.textAlign = 'left'
    ctx.textBaseline = 'hanging'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    ctx.fillText(txt,bounding_x_width_half,(bounding_y+focusBounding_y_height)/2)
    if(bounding_x-focusBounding_x!==0){ //排除边界
      ctx.fillText(txtL,(focusBounding_x+bounding_x)/2,bounding_y_height_half)
    }
    if(focusBounding_x_width-bounding_x_width!==0){
      ctx.fillText(txtR,(focusBounding_x_width+bounding_x_width)/2,bounding_y_height_half)
    }
    ctx.stroke()
    }


    ctx.beginPath();
    // x 轴线
    bounding.height<focusBounding.height?
    (
      ctx.moveTo(focusBounding_x,bounding_y_height_half),
      ctx.lineTo(bounding_x_width,bounding_y_height_half)
    ):(
      ctx.moveTo(focusBounding_x,focusBounding_y_height_half),
      ctx.lineTo(bounding_x_width,focusBounding_y_height_half)
    )
    
    ctx.strokeStyle = 'red'
    ctx.stroke();
    
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    bounding.height<focusBounding.height?
    ctx.fillText(`x:${Math.floor(focusBounding_x-bounding_x_width)}px`,(focusBounding_x+bounding_x_width)/2,bounding_y_height_half)
    :ctx.fillText(`x:${Math.floor(focusBounding_x-bounding_x_width)}px`,(focusBounding_x+bounding_x_width)/2,focusBounding_y_height_half)
  }
  // 环绕
  else if(bounding_y<focusBounding_y&&bounding_x_width>focusBounding_x_width&&bounding_y_height>focusBounding_y_height&&bounding_x<focusBounding_x) {
    ctx.beginPath();
    // x 轴线
    ctx.moveTo(focusBounding_x,focusBounding_y_height_half);
    ctx.lineTo(bounding_x,focusBounding_y_height_half);
    ctx.moveTo(focusBounding_x_width,focusBounding_y_height_half);
    ctx.lineTo(bounding_x_width,focusBounding_y_height_half);
    // // y 轴线
    ctx.moveTo(focusBounding_x_width_half,focusBounding_y);
    ctx.lineTo(focusBounding_x_width_half,bounding_y);
    ctx.moveTo(focusBounding_x_width_half,focusBounding_y_height);
    ctx.lineTo(focusBounding_x_width_half,bounding_y_height);
    ctx.strokeStyle = 'red'
    ctx.stroke();
    
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    ctx.fillText(`y:${Math.floor(focusBounding_y-bounding_y)}px`,focusBounding_x_width_half,(focusBounding_y+bounding_y)/2)
    ctx.fillText(`y:${Math.floor(bounding_y_height-focusBounding_y_height)}px`,focusBounding_x_width_half,(bounding_y_height+focusBounding_y_height)/2)
    
    ctx.textAlign = 'center'
    ctx.fillText(`x:${Math.floor(focusBounding_x-bounding_x)}px`,(focusBounding_x+bounding_x)/2,focusBounding_y_height_half)
    ctx.fillText(`x:${Math.floor(bounding_x_width-focusBounding_x_width)}px`,(bounding_x_width+focusBounding_x_width)/2,focusBounding_y_height_half)
  }
  // 内部包围
  else if(bounding_y>focusBounding_y&&bounding_x_width<focusBounding_x_width&&bounding_y_height<focusBounding_y_height&&bounding_x>focusBounding_x) {
    ctx.beginPath();
    // x 轴线
    ctx.moveTo(focusBounding_x,bounding_y_height_half);
    ctx.lineTo(bounding_x,bounding_y_height_half);
    ctx.moveTo(focusBounding_x_width,bounding_y_height_half);
    ctx.lineTo(bounding_x_width,bounding_y_height_half);
    // // y 轴线
    ctx.moveTo(bounding_x_width_half,focusBounding_y);
    ctx.lineTo(bounding_x_width_half,bounding_y);
    ctx.moveTo(bounding_x_width_half,focusBounding_y_height);
    ctx.lineTo(bounding_x_width_half,bounding_y_height);
    ctx.strokeStyle = 'red'
    ctx.stroke();
    
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.font = 'normal 20px 微软雅黑'
    ctx.fillStyle = 'red'
    ctx.fillText(`y:${Math.floor(-(focusBounding_y-bounding_y))}px`,bounding_x_width_half,(focusBounding_y+bounding_y)/2)
    ctx.fillText(`y:${Math.floor(-(bounding_y_height-focusBounding_y_height))}px`,bounding_x_width_half,(bounding_y_height+focusBounding_y_height)/2)
    ctx.textAlign = 'center'
    ctx.fillText(`x:${Math.floor(-(focusBounding_x-bounding_x))}px`,(focusBounding_x+bounding_x)/2,bounding_y_height_half)
    ctx.fillText(`x:${Math.floor(-(bounding_x_width-focusBounding_x_width))}px`,(bounding_x_width+focusBounding_x_width)/2,bounding_y_height_half)
  }
}

const leaveElement = function (e) {
  const ele = e.target
  ele.classList.remove('hoverEle');
  // if(focusEle&&focusEle===ele) {
  //   ele.classList.remove('focusElement')
  // }
  
  // document.getElementById(id).style.border = 'unset'
  ctx.putImageData(imageData, 0, 0);
  // ele.classList.remove('focus-border')
}

const drawBorder = function(e) {
  const canvas = document.getElementById('myCanvas')
  ctx = canvas.getContext('2d');
  const bounding = e.getBoundingClientRect()
  imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = 'normal 25px 微软雅黑'
  ctx.fillStyle = 'red'
  ctx.fillText(`hei:${Math.floor(bounding.height)}px`,bounding.x+bounding.width,bounding.y+bounding.height/2)
  ctx.fillText(`wid:${Math.floor(bounding.width)}px`,bounding.x+bounding.width/2,bounding.y+bounding.height)
}

const clickElement = (e) => {
const stage = new Konva.Stage({
  container:'container',
  width:dm.width,
  height:dm.height,
})
const layer = new Konva.Layer();
var arrow = new Konva.Arrow({
  x: stage.width() / 4,
  y: stage.height() / 4,
  points: [0, 0, dm.width / 2, dm.height / 2],
  pointerLength: 20,
  pointerWidth: 20,
  fill: 'black',
  stroke: 'black',
  strokeWidth: 4
});

// add the shape to the layer
layer.add(arrow);

// add the layer to the stage
stage.add(layer);

  const ele = e.target
  // if(typeof focusEle!==undefined) focusEle.classList.remove('focusElement');
  // try {
  //   focusEle.classList.remove('focusElement');
  // }
  // catch(e){
  //   console.log(e)
  // } 
  focusEle = ele;
  ele.classList.toggle('focusElement')
  // drawBorder(ele);
  const canvas = document.getElementById('myCanvas')
  ctx = canvas.getContext('2d');
  if(typeof imageData!== undefined) ctx.putImageData(imageData, 0, 0);
  imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
  const bounding = ele.getBoundingClientRect()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  ctx.font = 'normal 20px 微软雅黑'
  ctx.fillStyle = 'red'
  ctx.fillText(`hei:${Math.floor(bounding.height)}px`,bounding.x+bounding.width,bounding.y+bounding.height/2)
  ctx.textAlign = 'center'
  ctx.fillText(`wid:${Math.floor(bounding.width)}px`,bounding.x+bounding.width/2,bounding.y)

  // ctx.lineJoin = 'round'; 
  // ctx.fillStyle = 'red'
  // ctx.strokeRect(bounding.x+bounding.width,bounding.y+bounding.height/2,200,200);
  // imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
}

// display: ${Object.keys(mask).length!=0?'unset':'none'}
const embedToImage = function(href, width, height, item) {
  const { top, left, opacity,mask, name,visible } = item.export()
  // console.log('top:${top}px;left:${left}px;width:${width}px;height:${height}px;sizes:${sizes[0]};colors:${colors[0]};weights:${weights[0]}, alignment:${alignment};names:${names}')
  if(item.get('typeTool')) {
    const typeToolExport = item.get('typeTool').export()
    const { font, transform, value } = typeToolExport;
    const { sizes, colors, names,weights, alignment } = font;
    // console.log('font:',font)
    return `<img className="${name}" id="${name}" src="${href}" width="${width}" height="${height}" 
    style="
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    opacity: ${opacity};
    visibility: ${visible?'visible':'hidden'};
    cursor: pointer;
    "
    onClick="(${clickElement})(event)"
    onmouseenter="(${enterElement})(event)"
    onmouseleave="(${leaveElement})(event)"
    />`
  } else {
    return `<img className="${name}" id="${name}" src="${href}" width="${width}" height="${height}" 
  style="
  position: absolute;
  top: ${top}px;
  left: ${left}px;
  opacity: ${opacity};
  visibility: ${visible?'visible':'hidden'};
  cursor: pointer;
  "
  onClick="(${clickElement})(event)"
  onmouseenter="(${enterElement})(event)"
  onmouseleave="(${leaveElement})(event)"
/>`
  }
}



// 文字处理
// 文字处理
const toHex = (n) => {
  return parseInt(n, 10).toString(16).padStart(2, '0');
};

const toHexColor = (c = []) => {
  if (typeof c === 'string') {
    return c;
  }

  const [r = 0, g = 0, b = 0] = c;

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const resolveTransformAttrValue = function (text, item) {
  // const { transform } = text;
  // const { left,top } = item.export()
  // return `matrix(1 0 0 1 ${(transform.tx)/2} ${(transform.ty-top)/2})`;
}

const embedToText = function (text, item) {
  const {
    value,
    font,
    transform
  } = text;
  const {
    names,
    sizes,
    leading,
    colors,
    alignment
  } = font;
  const {
    top,
    left
  } = item.export()

  // return `<text x="${left}" y="${top + leading[0]}" transform="${resolveTransformAttrValue(text,item)}"  style="font-family: ${names}; font-size: ${sizes[0]/2}px" fill="${toHexColor(colors[0])}">${value}</text>`;
  return `<span className="txt" style="position:absolute;top:${top/2}px;left:${(left)/2}px; font-family: ${names}; font-size: ${sizes[0]/2}px; color:${toHexColor(colors[0])}"
      onClick="console.log('top:${top/2}px;left:${left/2}px;font-family: ${names}; font-size: ${sizes[0]/2}px; color:${toHexColor(colors[0])}; value:${value}; alignment:${alignment}')"
    >${value}</span>`
}

// svg
const generateSvg2 = function (doc, text) {
  const {
    width,
    height
  } = doc;
  return (
    `<?xml version="1.0" encoding="UTF-8"?>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    viewBox="0 0 ${width/2} ${height/2}"
    enable-background="new 0 0 ${width/2} ${height/2}"
    xml:space="preserve"
  >`
  );
}

// svg2
const generateSvg = function (doc, text) {
  const {
    width,
    height
  } = doc;
  return (
    `<?xml version="1.0" encoding="UTF-8"?>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    
    xml:space="preserve"
  >`
  );
}
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>PSD Data</title>
    <style>
        .focusElement{
          border:1px solid red;
        }
        .hoverEle{
          border:1px solid blue;
        }
    </style>
</head>
<body>
${generateHTML2(validPsdLayers)}
</body>
</html>
`;

fs.writeFile('./index7.html', htmlContent, (err) => {
    if (err) throw err;
    console.log('HTML file has been saved!');
});