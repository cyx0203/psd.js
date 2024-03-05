const psd = require('psd');
const fs = require('fs');
const { Server } = require('socket.io')
const { createServer } = require('http')
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

var count=0;
var html = ''
var imgList = [];

const httpServer = createServer(
  function(req,res){
    console.log("Request received from"+req.url)
    res.writeHead(200,{'Content-Type':'text/html'})
    html = fs.readFileSync(__dirname+'/index.html','utf-8')
    res.end(html);
  }
); // socket.io的服务需要http服务做支撑
    const io = new Server(httpServer, {
      // 初始化ws
      cors: {
        //处理ws跨域问题
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', socket => {
      // 监听ws链接成功
      console.log('socket connected!');
      console.log(`connected ${++count}`)

      socket.conn.on('close', reason => {
        console.log(reason);
        console.log(`socket close`)
        // io.close();
      });
      socket.on("disconnect", async () => {
        console.log(`socket disconnected!!`)
        console.log(`connected ${--count}`)
      })

      socket.on("chat message",(message)=>{
        console.log('收到来自客户端的消息:', message);
        // 向客户端发送消息
        // generateIMG(socket)
        const html = generateHTML(validPsdLayers)
        socket.emit('server message', imgList);
      })

      socket.on("uploadFile",(message)=>{
        console.log('收到来自客户端的消息:');
        console.log(message.fileName,message.fileType,message.fileData)
      })
    });

    httpServer.listen(3000); // 启动http服务

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


// 生成HTML
function generateHTML(array) {
    let html = '';
    for (let i = 0; i < array.length; i++) {
      if(array[i].layer.image) {
        const pngData = array[i].layer.image.toPng();
        const data = toBase64Sync(pngData);
        // html += embedToSVGImg(data, array[i].get('width'), array[i].get('height'), array[i])
        html += embedToImage(data, array[i].get('width'), array[i].get('height'), array[i])
        
      } else {}
    }
    html+= `<canvas id="myCanvas" width="${dm.width}" height="${dm.height}" style="position:absolute;pointer-events:none;left:0;top:0"></canvas>`;
    html+= `<div id="container"></div>`
    return html;
  }


//   onClick="(${clickElement})(event)"
//   onmouseenter="(${enterElement})(event)"
//   onmouseleave="(${leaveElement})(event)"
  const embedToImage = function(href, width, height, item) {
    const { top, left, opacity,mask, name,visible } = item.export()
    if(item.get('typeTool')) {
      const typeToolExport = item.get('typeTool').export()
      const { font, transform, value } = typeToolExport;
      const { sizes, colors, names,weights, alignment } = font;
      visible&&imgList.push({name:name,src:href,width:width,height:height,top:top,left:left,opacity:opacity,sizes:sizes[0],colors:colors[0],weights:weights[0], alignment:alignment,font:names,value:value,transform:transform})
    } else {
      visible&&imgList.push({name:name,src:href,width:width,height:height,top:top,left:left,opacity:opacity})
    }
    
    // console.log('top:${top}px;left:${left}px;width:${width}px;height:${height}px;sizes:${sizes[0]};colors:${colors[0]};weights:${weights[0]}, alignment:${alignment};names:${names}')
  //   if(item.get('typeTool')) {
  //     const typeToolExport = item.get('typeTool').export()
  //     const { font, transform, value } = typeToolExport;
  //     const { sizes, colors, names,weights, alignment } = font;
  //     // console.log('font:',font)
  //     imgList.push({name:name,src:href,width:width,height:height})
  //     return `<img className="${name}" id="${name}" src="${href}" width="${width}" height="${height}" 
  //     style="
  //     position: absolute;
  //     top: ${top}px;
  //     left: ${left}px;
  //     opacity: ${opacity};
  //     visibility: ${visible?'visible':'hidden'};
  //     onClick="(${clickElement})(event)"
  //  onmouseenter="(${enterElement})(event)"
  //  onmouseleave="(${leaveElement})(event)"
  //     cursor: pointer;
  //     "
      
  //     />`
  //   } else {
  //       imgList.push({name:name,src:href.substring(0,25),width:width,height:height})
  //     return `<img className="${name}" id="${name}" src="${href}" width="${width}" height="${height}" 
  //   style="
  //   position: absolute;
  //   top: ${top}px;
  //   left: ${left}px;
  //   opacity: ${opacity};
  //   visibility: ${visible?'visible':'hidden'};
  //   onClick="(${clickElement})(event)"
  //  onmouseenter="(${enterElement})(event)"
  //  onmouseleave="(${leaveElement})(event)"
  //   cursor: pointer;
  //   "
  // />`
  //   }
  }

const deasync = require('deasync');
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

// const htmlContent = `
// <!DOCTYPE html>
// <html>
// <head>
//     <title>Raphael.js</title>
//     <script src="https://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js"></script>
// </head>
// <body>
// ${generateHTML(validPsdLayers)}
// </body>
// </html>
// `;

// fs.writeFile('./index7.html', htmlContent, (err) => {
//     if (err) throw err;
//     console.log('HTML file has been saved!');
// });