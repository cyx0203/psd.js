const sketch2json = require('sketch2json');
const fs = require('fs')

const { Server } = require('socket.io')
const { createServer } = require('http')
var count=0; // 服务连接数
const httpServer = createServer(
  function(req,res){
    console.log("Request received from"+req.url)
    res.writeHead(200,{'Content-Type':'text/html'})
    html = fs.readFileSync(__dirname+'/index_sketch.html','utf-8')
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

        // 将数据传给客户端
        socket.emit('server message', sketchJson);
      })

      socket.on("uploadFile",(message)=>{
        console.log('收到来自客户端的消息:');
        console.log(message.fileName,message.fileType,message.fileData)
      })
    });

    httpServer.listen(3001); // 启动http服务

// 解析sketch文件
const sketchFilePath = './首页.sketch';
let sketchJson = []
fs.readFile(sketchFilePath, (error, data) => {
  sketch2json(data).then(result => {
    // console.log(result)
    const res = result.pages["11008235-26CF-4D8B-8CFA-FEA771EDDA0E"].layers[0].layers
    handle(res);
    console.log("启动成功...")
    })
})
// const res = sketch2json(fs.readFileSync(sketchFilePath, 'utf-8')).then(result => {
//   // console.log(result)
//   const res = result.pages["11008235-26CF-4D8B-8CFA-FEA771EDDA0E"].layers[0].layers
//   console.log("启动成功...")
// })
const handle=(res,prex=0,prey=0)=>{
  for(const i of res) {
    // console.log(i._class)
    switch(i._class) {
      case 'rectangle':
        renderRect(i,prex,prey);
        break;
      case 'text':
        renderText(i,prex,prey);
        break;
      case 'group'||'shapeGroup':
        handle(i.layers,prex+i.frame.x,prey+i.frame.y)
        break;
      case 'oval':
        renderOval(i,prex,prey);
        break;
      default :
        break;
    }
  }
}

const renderRect=(item,prex,prey)=>{
  if(!item.isVisible) return;
  let obj = {}
  const style = item.style;
  const frame = item.frame;
  const color = style.fills[0]&&style.fills[0].color;
  obj.type = 'rect'
  obj.left = frame.x + prex
  obj.top = frame.y + prey
  obj.width = frame.width
  obj.height = frame.height
  // obj.fill = color?`rgba(${color.red},${color.green},${color.blue},${color.alpha})`:'unset'
  obj.fill = "white"
  sketchJson.push(obj);
  // console.log(sketchJson);
}

const renderText=(item,prex,prey)=>{
  if(!item.isVisible) return;
  let obj = {}
  const style = item.style;
  const frame = item.frame;
  const fontAttribute = style.textStyle.encodedAttributes.MSAttributedStringFontAttribute.attributes
  const colorAttribute = style.textStyle.encodedAttributes.MSAttributedStringColorAttribute
  obj.type = 'text'
  obj.left = frame.x + prex
  obj.top = frame.y + prey
  // obj.width = frame.width
  // obj.height = frame.height
  obj.fill = `rgba(${colorAttribute.red},${colorAttribute.green},${colorAttribute.blue},${colorAttribute.alpha})`
  obj.fontSize = fontAttribute.size
  obj.fontFamily = fontAttribute.name
  obj.text = item.name
  sketchJson.push(obj);
  // console.log(sketchJson);
}

const renderOval=(item,prex,prey)=>{
  if(!item.isVisible) return;
  // console.log(item)
  let obj = {}
  const style = item.style;
  const frame = item.frame;
  const color = style.fills[0]&&style.fills[0].color;
  const radius = style.blur.radius;
  obj.type = 'oval'
  obj.left = frame.x + prex
  obj.top = frame.y + prey
  obj.width = frame.width
  obj.height = frame.height
  // obj.fill = color?`rgba(${color.red},${color.green},${color.blue},${color.alpha})`:'unset'
  obj.fill = "red"
  obj.radius = radius
  sketchJson.push(obj);
}