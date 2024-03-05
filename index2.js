import * as fs from "fs";
import Psd from "@webtoon/psd";

const psdData = fs.readFileSync("./demo.psd");
// Pass the ArrayBuffer instance inside the Buffer
const psdFile = Psd.parse(psdData.buffer);
console.log(psdFile);