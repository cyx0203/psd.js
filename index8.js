const psd = require('psd');
const fs = require('fs');

// 读取PSD文件
const file = psd.fromFile('./demo2.psd');
file.parse();

// 获取所有图层的树形结构
// const tree = file.tree().descendants();
const tree0 = file.tree().root();
const tree = tree0.subtree()
// 获取所有图层的数据
const layersData = Object.values(file.tree().export());
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
  const layerData = layersData.find(data => data.name === layerName&& data.type===layerType);

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
associateData(tree0,layersData)

// fs.writeFile('./info3.json', JSON.stringify(tree), (err) => {
//     if (err) throw err;
//     console.log('HTML file has been saved!');
// });
// return;


// 现在每个图层节点都有关联的图层数据
// console.log(tree);
function generateHTML(item) { //data
  // console.log(item.get('background'))
    let html = '';
    // 遍历数据
    // data.forEach((item) => {
        // 检查节点类型
        if (item.isGroup()) {
            // 如果是组节点，生成一个<div>标签
            html += `<div  style="position: absolute; top: ${item.top/2}px; left: ${item.left/2}px; width: ${item.width/2}px; height: ${item.height/2}px; background-color: ${item.get('backgroundColor')?item.get('backgroundColor'):'#00ddff'};">`;
            html += '</div>';
            // 递归生成组内的子元素
            // html += `<div style="position: relative"></div>`;
              // item.children().forEach((i)=>{html += generateHTML(i)}) // html += generateHTML(item.children());
              for(let i=0;i<item.children().length;i++){
                html += generateHTML(item.children()[i])
              }
              // html += '</div>';
            
        } 
        // else if (item.isShape()) {
        //     // 如果是形状节点，生成一个<div>标签
        //     html += `<div style="position: absolute; top: ${item.top}px; left: ${item.left}px; width: ${item.width}px; height: ${item.height}px; background-color: ${item.get('fillColor')};"></div>`;
        // }
        else if(item.isLayer()&&item.export().text) {
            // console.log(item.export().text)
            const text = item.export().text
            // html += `<div style="position: relative">`;
            
            // html += generateSvg(item.export(),text);
            html += embedToText(text,item);
            // html += `</svg>`;

            // html += '</div>';
        }
        else if(item.isLayer()&&item.export().image) {
          // console.log(item.layer.image)
          const pngData = item.layer.image.toPng();
          // toBase64(pngData).then(content => {
          //   // html += embedToImage(content, item.get('width'), item.get('height'))
          //   // console.log(content)
          //   html += `<p>123</p>`
          //   console.log(html)
          // })
          const data=toBase64Sync(pngData);
          html += embedToImage(data, item.get('width'), item.get('height'), item)
        }
        else if(item.isLayer()&&item.export().mask) {
          const vectorMask = item.get('vectorMask');
          vectorMask.parse();
          const paths = vectorMask.export();
          paths.forEach(path => {
            console.log(path);  // 路径节点数据
          });
        }
        else {
          for(let i=0;i<item.children().length;i++){
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
    
    image.pack();  // [1]
    image.on('data', (chunk) => {
      chunks.push(chunk);  // [2]
    });
    image.on('end', () => {
      resolve(`data:image/png;base64,${Buffer.concat(chunks).toString('base64')}`);  // [3]
    });
    image.on('error', (err) => {
      reject(err);
    });
  });
}

const deasync = require('deasync');

function toBase64Sync(image) {
  const chunks = [];
  let result = null;
  
  image.pack();  // [1]

  image.on('data', (chunk) => {
    chunks.push(chunk);  // [2]
  });

  image.on('end', () => {
    result = `data:image/png;base64,${Buffer.concat(chunks).toString('base64')}`;  // [3]
  });

  image.on('error', (err) => {
    throw err;
  });

  // 使用 deasync 来同步等待结果
  deasync.loopWhile(() => result === null);

  return result;
}

const embedToImage = function(href, width, height, item) {
  const { top, left } = item.export()
  return `<img src="${href}" width="${width}" height="${height}"/>`
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
  
    const [ r = 0, g = 0, b = 0 ] = c;
  
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  
  const resolveTransformAttrValue = function(text,item) {
    // const { transform } = text;
    // const { left,top } = item.export()
    // return `matrix(1 0 0 1 ${(transform.tx)/2} ${(transform.ty-top)/2})`;
  }

  const embedToText = function(text,item) {
    const { value, font, transform } = text;
    const { names, sizes, leading, colors } = font;
    const { top, left } = item.export()

    // return `<text x="${left}" y="${top + leading[0]}" transform="${resolveTransformAttrValue(text,item)}"  style="font-family: ${names}; font-size: ${sizes[0]/2}px" fill="${toHexColor(colors[0])}">${value}</text>`;
    return `<span style="position:absolute;top:${top/2}px;left:${(left)/2}px; font-family: ${names}; font-size: ${sizes[0]/2}px; color:${toHexColor(colors[0])}">${value}</span>`
  }

  // svg
  const generateSvg2 = function(doc,text) {
    const { width, height } = doc;
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
  const generateSvg = function(doc,text) {
    const { width, height } = doc;
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
        /* 样式信息 */
    </style>
</head>
<body>
    ${generateHTML(tree0)}
</body>
</html>
`;

fs.writeFile('./index7.html', htmlContent, (err) => {
    if (err) throw err;
    console.log('HTML file has been saved!');
});