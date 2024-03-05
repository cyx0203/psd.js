// 转化无符号浮点数
const signed = function(n) {
  let num = n;
  if (num > 0x8f) {
    num = num - 0xff - 1;
  }

  return num;
};
   
   const getPathPosition = function(pathNode) {
     const {
       vert,
       horiz
     } = pathNode;
   
     return {
       x: signed(horiz),
       y: signed(vert)
     };
   }
   
   const parsePath = function(path, { width, height }) {
     const {
       preceding,
       anchor,
       leaving
     } = path;
   
     const precedingPos = getPathPosition(preceding);
     const anchorPos = getPathPosition(anchor);
     const leavingPos = getPathPosition(leaving);
     
     // relX 和 relY 保留了PSD中原始数据。
     return {
       preceding: {
         relX: precedingPos.x,
         relY: precedingPos.y,
         x: Math.round(width * precedingPos.x),
         y: Math.round(height * precedingPos.y)
       },
       anchor: {
         relX: anchorPos.x,
         relY: anchorPos.y,
         x: Math.round(width * anchorPos.x),
         y: Math.round(height * anchorPos.y)
       },
       leaving: {
         relX: leavingPos.x,
         relY: leavingPos.y,
         x: Math.round(width * leavingPos.x),
         y: Math.round(height * leavingPos.y)
       }
     };
   }
   
  //  const vectorMask = node.get('vectorMask');
  //  vectorMask.parse();
  //  const paths = vectorMask.export();
  //  const convertedPath = []
  //  paths.forEach(path => {
  //    // 转换控制点的位置
  //    // 这里的 document 为psd.js导出的psd文档对象
  //    const { recordType, numPoints } = path;
  //    const {
  //      preceding,
  //      anchor,
  //      leaving
  //    } = parsePath(path, document);  // 控制点的位置转换成了像素位置
     
  //    convertedPath.push({
  //      preceding,
  //      anchor,
  //      leaving
  //    });
  //  });


// 绘制路径
   const toPath = (paths, fill) => {
    //  console.log(paths)
    let head;
    const data = [];
    
    paths.forEach((path, index) => {
      const { preceding, anchor, leaving } = path;
      if (index < paths.length - 1) {
        if (index > 0) {  // 中间节点
          data.push(`${preceding.x}, ${preceding.y} ${anchor.x}, ${anchor.y} ${leaving.x}, ${leaving.y}`);
           } else {  // 记录第一个节点，用于在关闭路径的时候使用
             head = path;
             data.push(`M ${anchor.x}, ${anchor.y} C${leaving.x}, ${leaving.y}`);
           }
         } else {
           data.push(`${preceding.x}, ${preceding.y} ${anchor.x}, ${anchor.y} ${leaving.x}, ${leaving.y} ${head.preceding.x}, ${head.preceding.y} ${head.anchor.x}, ${head.anchor.y} Z`);
         }
       });
       
       return `<path d="${data.join(' ')}" fill="${fill}" />`;
   }


   const toHexColor = (c = []) => {
    if (typeof c === 'string') {
      return c;
    }
  
    const [ r = 0, g = 0, b = 0 ] = c;
  
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

   // 填充颜色
   const getFillColor = function(node) {
    const solidColorData = node.get('solidColor');
    // console.log(solidColorData)
    if(solidColorData){
      const clr = solidColorData['Clr '];
      // console.log(clr)
      if(clr){
        return toHexColor(
          [
          Math.round(clr['Rd  ']),
          Math.round(clr['Grn ']),
          Math.round(clr['Bl  '])
        ]
        );
      }
    } return '#00ff15';
   };

   module.exports = {parsePath,toPath,getFillColor}