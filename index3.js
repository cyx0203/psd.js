/*
 * @Author: zetawoo zetawoo@163.com
 * @Date: 2023-07-28 15:01:20
 * @LastEditTime: 2023-07-28 15:01:37
 * @LastEditors: zetawoo
 * @Description: 
 * @FilePath: \psd\index3.js
 * GGUXD
 */
const PSD = require('psd');

// 打开PSD文件
const psd = PSD.fromFile('./demo.psd');

// 解析PSD文件
psd.parse();

// 获取图层树
const tree = psd.tree();

// 通过group的名字查找group图层
const group = tree.childrenAtPath('path/to/group')[0];
console.log(group);

return;

// 获取group的图层路径
const groupPath = group.path();

console.log(`group的图层路径: ${groupPath}`);
