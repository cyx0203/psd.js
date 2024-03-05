const PSD = require('psd');
// const psdFile = PSD.fromFile('./demo.psd');
const psdFile = './demo2.psd';
const fs = require('fs');
// psdFile.parse();
// console.log(psdFile.tree().export())

PSD.open(psdFile).then(function (psd) {
    console.log('PSD INFO');
    // fs.writeFileSync('index7.json', JSON.stringify(psd.tree().export()));
    // fs.writeFileSync('index6.json', JSON.stringify(psd.tree().export()));
    // const node = psd.tree().descendants()[0];
    // console.log(node.get('name'));
    // const node = psd.tree().childrenAtPath(['交易量走势 拷贝 2'])[0]
    // console.log(node);
    // const vectorMask = node.get('width');
    // console.log(vectorMask);
    // vectorMask.parse();
    // const data = vectorMask.export()
    // console.log(data);
    // const { paths = [] } = data;
    // paths.forEach(path => {
      // 变量路径节点
      // console.log(path);
    // });

    // const pngData = node.layer.image.toPng();
    // console.log(pngData)
    // toBase64(pngData).then(content => {
    //     const image = embedToImage(content, node.get('width'), node.get('height'));
    //     console.log(image)
    //     fs.writeFileSync('index6.json', image);
    // });
    // return psd.image.saveAsPng('./index7.png');

    const node = psd.tree().childrenAtPath(['确认按钮'])[0];
    // console.log(node.export().children[0].text);
    const text = embedToText(node.export().children[0].text);
    console.log(text);
}).then(function () {
    console.log("Finished!");
  });

// 图片处理
// 关键步骤：
// [1] 通过pack方法将图片数据转成stream对象
// [2] 基于stream的data事件，获取流数据
// [3] 通过Buffer将流数据转换成Base64字符串

const toBase64 = function(image) {
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
  
  const embedToImage = function(href, width, height) {
    return `<image xlink:href="${href}" width="${width}" height="${height}"/>
  `
  }

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
  
  const embedToText = function(text) {
    const { value, font, left, top } = text;
    const { name, sizes, leading, colors } = font;
    
    return `<text x="${left}" y="${top + leading[0]}" style="font-family: ${name}; font-size: ${sizes[0]}px" fill="${toHexColor(colors[0])}">${value}</text>`;
  }