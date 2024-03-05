const psd = require('psd');
const fs = require('fs');

// 读取PSD文件
const file = psd.fromFile('./demo2.psd');
file.parse();

// 获取所有图层的树形结构
const tree = file.tree().descendants();

// 获取所有图层的数据
const layersData = Object.values(file.tree().export());

// 定义一个递归函数，用于将树形结构和图层数据进行关联
function associateData(node, layersData) {
  // 获取当前节点的图层名称
  const layerName = node.layer.name;

  // 获取当前节点的图层数据
  const layerData = layersData.find(data => data.name === layerName);

  // 关联当前节点的数据
  node.data = layerData;

  // 获取子节点的数组
  const children = Object.values(node.children || {});

  // 遍历子节点进行递归关联
  children.forEach(child => associateData(child, layersData));
}

// 对每个图层的树形结构进行关联处理
tree.forEach(node => associateData(node, layersData));

// fs.writeFile('./info3.json', JSON.stringify(tree), (err) => {
//     if (err) throw err;
//     console.log('HTML file has been saved!');
// });
// return;


// 现在每个图层节点都有关联的图层数据
// console.log(tree);
function generateHTML(data) {
    let html = '';

    // 遍历数据
    data.forEach((item) => {
        // 检查节点类型
        if (item.isGroup()) {
            // 如果是组节点，生成一个<div>标签
            html += `<div  style="position: absolute; top: ${item.top}px; left: ${item.left}px; width: ${item.width}px; height: ${item.height}px; background-color: ${item.get('backgroundColor')?item.get('backgroundColor'):'#00ddff'};">`;
            // 递归生成组内的子元素
            html += generateHTML(item.children());
            html += '</div>';
        } 
        // else if (item.isShape()) {
        //     // 如果是形状节点，生成一个<div>标签
        //     html += `<div style="position: absolute; top: ${item.top}px; left: ${item.left}px; width: ${item.width}px; height: ${item.height}px; background-color: ${item.get('fillColor')};"></div>`;
        // }
    });

    return html;
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
    ${generateHTML(tree)}
</body>
</html>
`;

fs.writeFile('./output.html', htmlContent, (err) => {
    if (err) throw err;
    console.log('HTML file has been saved!');
});

