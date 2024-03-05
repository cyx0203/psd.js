/*
 * @Author: zetawoo zetawoo@163.com
 * @Date: 2023-07-31 21:19:19
 * @LastEditTime: 2023-07-31 21:19:38
 * @LastEditors: zetawoo
 * @Description: 
 * @FilePath: \psd\index4.js
 * GGUXD
 */
const psd = require('psd');

// 读取PSD文件
const file = psd.fromFile('./demo.psd');
file.parse();

// 获取所有图层的树形结构
const tree = file.tree().descendants();

// 获取所有图层的数据
const layersData = file.tree().export();

// 定义一个递归函数，用于将树形结构和图层数据进行关联
function associateData(node, layersData) {
  // 获取当前节点的图层数据
  console.log(layersData);
  const layerData = layersData.find(data => data.layer === node.layer);
  
  // 关联当前节点的数据
  node.data = layerData;

  // 遍历当前节点的子节点进行递归关联
  node.children?.forEach(child => associateData(child, layersData));
}

// 对每个图层的树形结构进行关联处理
tree.forEach(node => associateData(node, layersData));

// 现在每个图层节点都有关联的图层数据
console.log(tree);
