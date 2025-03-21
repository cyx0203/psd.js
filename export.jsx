var doc = app.activeDocument;
var oldPath = activeDocument.path;
var exportfolder = Folder(oldPath + "/" + getFileBaseName(doc.name));
if (!exportfolder.exists) exportfolder.create();

var processAll = true;
var tagFlag = "#";    //需要导出的的层
var tagFlag1 = "##";  //需要导出的层，该标记存在的话，#标记将被忽略
var tbFlag = "$";     //扩充透明边标记，比如 abc#12，表示要扩 12个像素的透明边
var layersToExport = {};
var layerPaddings = {}; //需要扩充的透明边数据

function main() {
    if (documents.length) {
        recurseGroupsAndLayers(doc, "", null);
        for (var lname in layersToExport) {d
            exportGroup(layersToExport[lname], lname, layerPaddings[lname]);
        }
    }
}




function getPadding(layer){
      
      if(layer.name.indexOf(tbFlag) != -1){
                var m = layer.name.match(/\$(\d+)/);
              
                if(m != null){
                    
                    return m[1];
                }
            }
        return null;
}
//遍历所有的图层和组，保存标记为 # 号的
function recurseGroupsAndLayers(lay, name, padding) {
    //当前分组下的图层
    function _listLayers(lay, name, padding) {
        var layers = lay.layers;
        for (i = 0; i < layers.length; i++) {
            
          
            var lname = layers[i].name;

            if (name != "" )
                lname = name + "-" + layers[i].name;

            var pd = getPadding(layers[i]);
           
            layerPaddings[lname] = (pd == null)? padding : pd; //如果没有配置，直接继承上级的配置


            if (layers[i].name.indexOf(tagFlag1) == 0) {

                layersToExport[lname] = layers[i];
                processAll = false;
            } else if (layers[i].name.indexOf(tagFlag) == 0) {
                layersToExport[lname] = layers[i];
            }
        }
    }
    //当前分组下的分组
    var layers = lay.layerSets;
    for (var i = 0; i < layers.length; i++) {
        var lname = layers[i].name;
        if (name != "")
            lname = name + "-" + layers[i].name;

     var pd = getPadding(layers[i]);
            layerPaddings[lname] = (pd == null)? padding : pd; //如果没有配置，直接继承上级的配置


        if (layers[i].name.indexOf(tagFlag1) == 0) {

            layersToExport[lname] = layers[i];
            processAll = false;
        } else if (layers[i].name.indexOf(tagFlag) == 0) {
            layersToExport[lname] = layers[i];
        }

        recurseGroupsAndLayers(layers[i], lname, layerPaddings[lname]);
    }
    _listLayers(lay, name, layerPaddings[lname]);


    // for(var lname in layersToExport){

    //            exportGroup(layersToExport[lname], lname);
    // }
}




function exportGroup(lay, name, padding) {
    log(lay.name);
    log(processAll);

    if (processAll == false && lay.name.indexOf(tagFlag1) == -1) {
        return;
    }
    log(lay.name);




    activeDocument.activeLayer = lay;
    var newDoc = doc.duplicate(lay.name, false); // dupe with new name and as flattened doc.




    var layer = activeDocument.activeLayer;

    layer.move(newDoc, ElementPlacement.PLACEATBEGINNING);

    var layers = activeDocument.layerSets;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i] != layer) {
            layers[i].visible = false;
        }
    }

    var layers = activeDocument.layers;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i] != layer) {
            layers[i].visible = false;
        }
    }

    //activeDocument.trim(TrimType.TRANSPARENT,true,true,true,true);
    //activeDocument.trim(TrimType.TRANSPARENT);

    activeDocument.trim(TrimType.TRANSPARENT, true, true, true, true);
 
if(padding != null ){ //扩充透明边
 
    paddingCanvas(padding);
       name = name.replaceAll(/\$\d+/g, "") //去除padding配置
}

    name = name.replaceAll(/#/g, ""); //去除#配置


 


    tmpName = name.split("-");
    segName = "";
    dirName = "";
  
    for(var i = 0; i < tmpName.length; i++){
         
      if(segName !== "")
          segName += "-" + tmpName[i];
      else
          segName = tmpName[i]; 

        if(tmpName[i].indexOf("/") != -1){
            //this is folder
          dirName += segName.replaceAll("/", "") + "/";

          createFolder(exportfolder + "/" + dirName);
          //dirName = dirName.replaceAll("/", "");
          segName = "";
            
        }
    }    


1/1;

    if ( name.endsWith(".jpg") ){
        saveJPEG(exportfolder + "/" + dirName, segName, 70);  
    }else{
    //log("layer:" + lay.name );
        //var saveFile = File(exportfolder + "/" + name + ".png");
    //savePNG(activeDocument, saveFile);
    
    
        savePNG24(exportfolder + "/" + dirName, segName + ".png");
    }
    activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}




// function savePNG(saveFile){
//     var pngOpts = new ExportOptionsSaveForWeb; 
//     pngOpts.format = SaveDocumentType.PNG
//     pngOpts.PNG8 = false; 
//     pngOpts.transparency = true; 
//     pngOpts.interlaced = false; 
//     pngOpts.quality = 100;
//     activeDocument.exportDocument(new File(saveFile),ExportType.SAVEFORWEB,pngOpts); 
// }




//common functions

File.prototype.fileName = function() {
    return this.name.replace(/.[^.]+$/, '');
}

File.prototype.fileExt = function() {
    return this.name.replace(/^.*\./, '');
}




function getFileBaseName(str) {
    var base = new String(str).substring(str.lastIndexOf('/') + 1);
    if (base.lastIndexOf(".") != -1)
        base = base.substring(0, base.lastIndexOf("."));
    return base;
}


cTID = function(s) {
    return app.charIDToTypeID(s);
};
sTID = function(s) {
    return app.stringIDToTypeID(s);
};

function log(text) {
    $.writeln(text);
}


// function restoreHistory(doc) {
//   doc.activeHistoryState = activeDocument.historyStates[historyIndex];
// }

 

//保存png
function savePNG(doc, fileName) {
    var pngSaveOptions = new PNGSaveOptions();
    var file = new File(fileName);
    if (file.exists) file.remove();
    doc.saveAs(file, pngSaveOptions, true, Extension.LOWERCASE);
};
//删除文件，如果文件存在的话
function delFileIfExists(fileName) {
    var file = new File(fileName);
    if (file.exists) file.remove();
    return file;
}

function createFolder(dir) {
    var folder = new Folder(dir);
    if (!folder.exists) folder.create();
    return dir;
}

function paddingCanvas(x) {
 
  function step1(enabled, withDialog) {
    if (enabled != undefined && !enabled)
      return;
    var dialogMode = (withDialog ? DialogModes.ALL : DialogModes.NO);
    var desc1 = new ActionDescriptor();
    desc1.putBoolean(cTID('Rltv'), true);
    desc1.putUnitDouble(cTID('Wdth'), cTID('#Pxl'), x);
    desc1.putUnitDouble(cTID('Hght'), cTID('#Pxl'), x);
    desc1.putEnumerated(cTID('Hrzn'), cTID('HrzL'), cTID('Cntr'));
    desc1.putEnumerated(cTID('Vrtc'), cTID('VrtL'), cTID('Cntr'));
    executeAction(sTID('canvasSize'), desc1, dialogMode);
  };

  step1();      // »­²¼´óÐ¡     
};


//删除选中内容
function deleteSelectedContent(enabled, withDialog) {
    if (enabled != undefined && !enabled)
        return;
    var dialogMode = (withDialog ? DialogModes.ALL : DialogModes.NO);
    executeAction(cTID('Dlt '), undefined, dialogMode);
}

//设置前景色
function setForegroundColor(r, g, b, enabled, withDialog) {
    if (enabled != undefined && !enabled)
        return;
    var dialogMode = (withDialog ? DialogModes.ALL : DialogModes.NO);
    var desc1 = new ActionDescriptor();
    var ref1 = new ActionReference();
    ref1.putProperty(cTID('Clr '), cTID('FrgC'));
    desc1.putReference(cTID('null'), ref1);
    var desc2 = new ActionDescriptor();
    desc2.putDouble(cTID('Rd  '), r);
    desc2.putDouble(cTID('Grn '), g);
    desc2.putDouble(cTID('Bl  '), b);
    desc1.putObject(cTID('T   '), sTID("RGBColor"), desc2);
    desc1.putString(cTID('Srce'), "photoshopPicker");
    executeAction(cTID('setd'), desc1, dialogMode);
};


//选择笔刷
function selectBrush(brushName) {
    // 选择笔刷工具
    function step1(enabled, withDialog) {
        if (enabled != undefined && !enabled)
            return;
        var dialogMode = (withDialog ? DialogModes.ALL : DialogModes.NO);
        var desc1 = new ActionDescriptor();
        var ref1 = new ActionReference();
        ref1.putClass(cTID('PbTl'));
        desc1.putReference(cTID('null'), ref1);
        executeAction(cTID('slct'), desc1, dialogMode);
    };

    // 设置笔刷为 dashed 笔刷
    function step2(brushName, enabled, withDialog) {
        if (enabled != undefined && !enabled)
            return;
        var dialogMode = (withDialog ? DialogModes.ALL : DialogModes.NO);
        var desc1 = new ActionDescriptor();
        var ref1 = new ActionReference();
        ref1.putName(cTID('Brsh'), brushName);
        desc1.putReference(cTID('null'), ref1);
        executeAction(cTID('slct'), desc1, dialogMode);
    };

    step1(); // Select
    step2(brushName); // Select
};

//选择透明区域
function selectTransparency() {
    var desc27 = new ActionDescriptor();
    var ref3 = new ActionReference();
    ref3.putProperty(cTID('Chnl'), cTID('fsel'));
    desc27.putReference(cTID('null'), ref3);
    var ref4 = new ActionReference();
    ref4.putEnumerated(cTID('Chnl'), cTID('Chnl'), cTID('Trsp'));
    desc27.putReference(cTID('T   '), ref4);
    executeAction(cTID('setd'), desc27, DialogModes.NO);
};


//获取当前目录下的子目录
function getSonFolders(path) {
    var folder = new Folder(path);

    var results = [];

    var files = folder.getFiles();
    for (var i = 0; i < files.length; i++) {

        if (!(files[i] instanceof File))
            results.push(files[i]);
    }
    return results;
}




//递归列出指定目录下的所有文件
function traverseFolder(path, mask, results) {
    // Create new folder object based on path string  
    var folder = new Folder(path);
    if (results == null)
        results = [];

    // Get all files in the current folder  
    var files = folder.getFiles();

    // Loop over the files in the files object  
    for (var i = 0; i < files.length; i++) {
        // Check if the file is an instance of a file  
        // else call the traverse folder recursively with the current folder as an argument  
        if (files[i] instanceof File) {
            // Convert the file object to a string for matching purposes (match only works on String objects)  
            var fileString = String(files[i]);

            // Check if the file contains the right extension  
            if (fileString.match(mask)) {

                // Do something if the file matches  
                results.push(fileString);
            } else {

                // Do something if the file doesn't match  
                //alert(fileString + 'bad file');  
            }
        } else {


            // Call method recursively with the current folder as an argument  
            traverseFolder(files[i], mask, results);
        }
    }
    return results;
}


// Export
function savePNG24(saveDir, saveName, enabled, withDialog) {
    if (enabled != undefined && !enabled)
        return;
    var dialogMode = (withDialog ? DialogModes.ALL : DialogModes.NO);
    var desc1 = new ActionDescriptor();
    var desc2 = new ActionDescriptor();
    desc2.putEnumerated(cTID('Op  '), cTID('SWOp'), cTID('OpSa'));
    desc2.putBoolean(cTID('DIDr'), true);
    desc2.putPath(cTID('In  '), new Folder(saveDir));
    desc2.putString(cTID('ovFN'), saveName);
    desc2.putEnumerated(cTID('Fmt '), cTID('IRFm'), cTID('PN24'));
    desc2.putBoolean(cTID('Intr'), false);
    desc2.putBoolean(cTID('Trns'), true);
    desc2.putBoolean(cTID('Mtt '), true);
    desc2.putInteger(cTID('MttR'), 255);
    desc2.putInteger(cTID('MttG'), 255);
    desc2.putInteger(cTID('MttB'), 255);
    desc2.putBoolean(cTID('SHTM'), false);
    desc2.putBoolean(cTID('SImg'), true);
    desc2.putEnumerated(cTID('SWsl'), cTID('STsl'), cTID('SLAl'));
    desc2.putEnumerated(cTID('SWch'), cTID('STch'), cTID('CHsR'));
    desc2.putEnumerated(cTID('SWmd'), cTID('STmd'), cTID('MDCC'));
    desc2.putBoolean(cTID('ohXH'), false);
    desc2.putBoolean(cTID('ohIC'), true);
    desc2.putBoolean(cTID('ohAA'), true);
    desc2.putBoolean(cTID('ohQA'), true);
    desc2.putBoolean(cTID('ohCA'), false);
    desc2.putBoolean(cTID('ohIZ'), true);
    desc2.putEnumerated(cTID('ohTC'), cTID('SToc'), cTID('OC03'));
    desc2.putEnumerated(cTID('ohAC'), cTID('SToc'), cTID('OC03'));
    desc2.putInteger(cTID('ohIn'), -1);
    desc2.putEnumerated(cTID('ohLE'), cTID('STle'), cTID('LE03'));
    desc2.putEnumerated(cTID('ohEn'), cTID('STen'), cTID('EN00'));
    desc2.putBoolean(cTID('olCS'), false);
    desc2.putEnumerated(cTID('olEC'), cTID('STst'), cTID('ST00'));
    desc2.putEnumerated(cTID('olWH'), cTID('STwh'), cTID('WH01'));
    desc2.putEnumerated(cTID('olSV'), cTID('STsp'), cTID('SP04'));
    desc2.putEnumerated(cTID('olSH'), cTID('STsp'), cTID('SP04'));
    var list1 = new ActionList();
    var desc3 = new ActionDescriptor();
    desc3.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC00'));
    list1.putObject(cTID('SCnc'), desc3);
    var desc4 = new ActionDescriptor();
    desc4.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC19'));
    list1.putObject(cTID('SCnc'), desc4);
    var desc5 = new ActionDescriptor();
    desc5.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC28'));
    list1.putObject(cTID('SCnc'), desc5);
    var desc6 = new ActionDescriptor();
    desc6.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list1.putObject(cTID('SCnc'), desc6);
    var desc7 = new ActionDescriptor();
    desc7.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list1.putObject(cTID('SCnc'), desc7);
    var desc8 = new ActionDescriptor();
    desc8.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list1.putObject(cTID('SCnc'), desc8);
    desc2.putList(cTID('olNC'), list1);
    desc2.putBoolean(cTID('obIA'), false);
    desc2.putString(cTID('obIP'), "");
    desc2.putEnumerated(cTID('obCS'), cTID('STcs'), cTID('CS01'));
    var list2 = new ActionList();
    var desc9 = new ActionDescriptor();
    desc9.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC01'));
    list2.putObject(cTID('SCnc'), desc9);
    var desc10 = new ActionDescriptor();
    desc10.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC20'));
    list2.putObject(cTID('SCnc'), desc10);
    var desc11 = new ActionDescriptor();
    desc11.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC02'));
    list2.putObject(cTID('SCnc'), desc11);
    var desc12 = new ActionDescriptor();
    desc12.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC19'));
    list2.putObject(cTID('SCnc'), desc12);
    var desc13 = new ActionDescriptor();
    desc13.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC06'));
    list2.putObject(cTID('SCnc'), desc13);
    var desc14 = new ActionDescriptor();
    desc14.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list2.putObject(cTID('SCnc'), desc14);
    var desc15 = new ActionDescriptor();
    desc15.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list2.putObject(cTID('SCnc'), desc15);
    var desc16 = new ActionDescriptor();
    desc16.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list2.putObject(cTID('SCnc'), desc16);
    var desc17 = new ActionDescriptor();
    desc17.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC22'));
    list2.putObject(cTID('SCnc'), desc17);
    desc2.putList(cTID('ovNC'), list2);
    desc2.putBoolean(cTID('ovCM'), false);
    desc2.putBoolean(cTID('ovCW'), false);
    desc2.putBoolean(cTID('ovCU'), true);
    desc2.putBoolean(cTID('ovSF'), true);
    desc2.putBoolean(cTID('ovCB'), true);
    desc2.putString(cTID('ovSN'), "images");
    desc1.putObject(cTID('Usng'), sTID("SaveForWeb"), desc2);
    executeAction(cTID('Expr'), desc1, dialogMode);
};


function saveJPEG(saveDir, saveName, qlty, enabled, withDialog) {
    
    //     desc2.putPath(cTID('In  '), new Folder(saveDir));
    // desc2.putString(cTID('ovFN'), saveName);

    if (enabled != undefined && !enabled)
      return;
    var dialogMode = (withDialog ? DialogModes.ALL : DialogModes.NO);
    var desc1 = new ActionDescriptor();
    var desc2 = new ActionDescriptor();
    desc2.putEnumerated(cTID('Op  '), cTID('SWOp'), cTID('OpSa'));
    desc2.putBoolean(cTID('DIDr'), true);
    desc2.putPath(cTID('In  '), new Folder(saveDir));
    desc2.putString(cTID('ovFN'), saveName);
    desc2.putEnumerated(cTID('Fmt '), cTID('IRFm'), sTID("JPEGFormat"));
    desc2.putBoolean(cTID('Intr'), false);
    desc2.putInteger(cTID('Qlty'), qlty);
    desc2.putInteger(cTID('QChS'), 0);
    desc2.putInteger(cTID('QCUI'), 0);
    desc2.putBoolean(cTID('QChT'), false);
    desc2.putBoolean(cTID('QChV'), false);
    desc2.putBoolean(cTID('Optm'), true);
    desc2.putInteger(cTID('Pass'), 1);
    desc2.putDouble(cTID('blur'), 0);
    desc2.putBoolean(cTID('EICC'), false);
    desc2.putBoolean(cTID('Mtt '), true);
    desc2.putInteger(cTID('MttR'), 255);
    desc2.putInteger(cTID('MttG'), 255);
    desc2.putInteger(cTID('MttB'), 255);
    desc2.putBoolean(cTID('SHTM'), false);
    desc2.putBoolean(cTID('SImg'), true);
    desc2.putEnumerated(cTID('SWsl'), cTID('STsl'), cTID('SLAl'));
    desc2.putEnumerated(cTID('SWch'), cTID('STch'), cTID('CHsR'));
    desc2.putEnumerated(cTID('SWmd'), cTID('STmd'), cTID('MDCC'));
    desc2.putBoolean(cTID('ohXH'), false);
    desc2.putBoolean(cTID('ohIC'), true);
    desc2.putBoolean(cTID('ohAA'), true);
    desc2.putBoolean(cTID('ohQA'), true);
    desc2.putBoolean(cTID('ohCA'), false);
    desc2.putBoolean(cTID('ohIZ'), true);
    desc2.putEnumerated(cTID('ohTC'), cTID('SToc'), cTID('OC03'));
    desc2.putEnumerated(cTID('ohAC'), cTID('SToc'), cTID('OC03'));
    desc2.putInteger(cTID('ohIn'), -1);
    desc2.putEnumerated(cTID('ohLE'), cTID('STle'), cTID('LE03'));
    desc2.putEnumerated(cTID('ohEn'), cTID('STen'), cTID('EN00'));
    desc2.putBoolean(cTID('olCS'), false);
    desc2.putEnumerated(cTID('olEC'), cTID('STst'), cTID('ST00'));
    desc2.putEnumerated(cTID('olWH'), cTID('STwh'), cTID('WH01'));
    desc2.putEnumerated(cTID('olSV'), cTID('STsp'), cTID('SP04'));
    desc2.putEnumerated(cTID('olSH'), cTID('STsp'), cTID('SP04'));
    var list1 = new ActionList();
    var desc3 = new ActionDescriptor();
    desc3.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC00'));
    list1.putObject(cTID('SCnc'), desc3);
    var desc4 = new ActionDescriptor();
    desc4.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC19'));
    list1.putObject(cTID('SCnc'), desc4);
    var desc5 = new ActionDescriptor();
    desc5.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC28'));
    list1.putObject(cTID('SCnc'), desc5);
    var desc6 = new ActionDescriptor();
    desc6.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list1.putObject(cTID('SCnc'), desc6);
    var desc7 = new ActionDescriptor();
    desc7.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list1.putObject(cTID('SCnc'), desc7);
    var desc8 = new ActionDescriptor();
    desc8.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list1.putObject(cTID('SCnc'), desc8);
    desc2.putList(cTID('olNC'), list1);
    desc2.putBoolean(cTID('obIA'), false);
    desc2.putString(cTID('obIP'), "");
    desc2.putEnumerated(cTID('obCS'), cTID('STcs'), cTID('CS01'));
    var list2 = new ActionList();
    var desc9 = new ActionDescriptor();
    desc9.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC01'));
    list2.putObject(cTID('SCnc'), desc9);
    var desc10 = new ActionDescriptor();
    desc10.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC20'));
    list2.putObject(cTID('SCnc'), desc10);
    var desc11 = new ActionDescriptor();
    desc11.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC02'));
    list2.putObject(cTID('SCnc'), desc11);
    var desc12 = new ActionDescriptor();
    desc12.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC19'));
    list2.putObject(cTID('SCnc'), desc12);
    var desc13 = new ActionDescriptor();
    desc13.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC06'));
    list2.putObject(cTID('SCnc'), desc13);
    var desc14 = new ActionDescriptor();
    desc14.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list2.putObject(cTID('SCnc'), desc14);
    var desc15 = new ActionDescriptor();
    desc15.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list2.putObject(cTID('SCnc'), desc15);
    var desc16 = new ActionDescriptor();
    desc16.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list2.putObject(cTID('SCnc'), desc16);
    var desc17 = new ActionDescriptor();
    desc17.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC22'));
    list2.putObject(cTID('SCnc'), desc17);
    desc2.putList(cTID('ovNC'), list2);
    desc2.putBoolean(cTID('ovCM'), false);
    desc2.putBoolean(cTID('ovCW'), false);
    desc2.putBoolean(cTID('ovCU'), true);
    desc2.putBoolean(cTID('ovSF'), true);
    desc2.putBoolean(cTID('ovCB'), true);
    desc2.putString(cTID('ovSN'), "images");
    desc1.putObject(cTID('Usng'), sTID("SaveForWeb"), desc2);
    executeAction(sTID('export'), desc1, dialogMode);
 
}


// Export
function savePNG8(saveDir, saveName, enabled, withDialog) {
    if (enabled != undefined && !enabled)
        return;



    var dialogMode = (withDialog ? DialogModes.ALL : DialogModes.NO);
    var desc1 = new ActionDescriptor();
    var desc2 = new ActionDescriptor();
    desc2.putEnumerated(cTID('Op  '), cTID('SWOp'), cTID('OpSa'));
    desc2.putBoolean(cTID('DIDr'), true);
    desc2.putPath(cTID('In  '), new Folder(saveDir));
    desc2.putString(cTID('ovFN'), saveName);
    desc2.putEnumerated(cTID('Fmt '), cTID('IRFm'), cTID('PNG8'));
    desc2.putBoolean(cTID('Intr'), false);
    desc2.putEnumerated(cTID('RedA'), cTID('IRRd'), cTID('Sltv'));
    desc2.putBoolean(cTID('RChT'), false);
    desc2.putBoolean(cTID('RChV'), false);
    desc2.putBoolean(cTID('AuRd'), false);
    desc2.putInteger(cTID('NCol'), 128);
    desc2.putEnumerated(cTID('Dthr'), cTID('IRDt'), cTID('Dfsn'));
    desc2.putInteger(cTID('DthA'), 88);
    desc2.putInteger(cTID('DChS'), 0);
    desc2.putInteger(cTID('DCUI'), 0);
    desc2.putBoolean(cTID('DChT'), false);
    desc2.putBoolean(cTID('DChV'), false);
    desc2.putInteger(cTID('WebS'), 0);
    desc2.putEnumerated(cTID('TDth'), cTID('IRDt'), cTID('None'));
    desc2.putInteger(cTID('TDtA'), 100);
    desc2.putBoolean(cTID('Trns'), true);
    desc2.putBoolean(cTID('Mtt '), true);
    desc2.putInteger(cTID('MttR'), 255);
    desc2.putInteger(cTID('MttG'), 255);
    desc2.putInteger(cTID('MttB'), 255);
    desc2.putBoolean(cTID('SHTM'), false);
    desc2.putBoolean(cTID('SImg'), true);
    desc2.putEnumerated(cTID('SWsl'), cTID('STsl'), cTID('SLAl'));
    desc2.putEnumerated(cTID('SWch'), cTID('STch'), cTID('CHsR'));
    desc2.putEnumerated(cTID('SWmd'), cTID('STmd'), cTID('MDCC'));
    desc2.putBoolean(cTID('ohXH'), false);
    desc2.putBoolean(cTID('ohIC'), true);
    desc2.putBoolean(cTID('ohAA'), true);
    desc2.putBoolean(cTID('ohQA'), true);
    desc2.putBoolean(cTID('ohCA'), false);
    desc2.putBoolean(cTID('ohIZ'), true);
    desc2.putEnumerated(cTID('ohTC'), cTID('SToc'), cTID('OC03'));
    desc2.putEnumerated(cTID('ohAC'), cTID('SToc'), cTID('OC03'));
    desc2.putInteger(cTID('ohIn'), -1);
    desc2.putEnumerated(cTID('ohLE'), cTID('STle'), cTID('LE03'));
    desc2.putEnumerated(cTID('ohEn'), cTID('STen'), cTID('EN00'));
    desc2.putBoolean(cTID('olCS'), false);
    desc2.putEnumerated(cTID('olEC'), cTID('STst'), cTID('ST00'));
    desc2.putEnumerated(cTID('olWH'), cTID('STwh'), cTID('WH01'));
    desc2.putEnumerated(cTID('olSV'), cTID('STsp'), cTID('SP04'));
    desc2.putEnumerated(cTID('olSH'), cTID('STsp'), cTID('SP04'));
    var list1 = new ActionList();
    var desc3 = new ActionDescriptor();
    desc3.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC00'));
    list1.putObject(cTID('SCnc'), desc3);
    var desc4 = new ActionDescriptor();
    desc4.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC19'));
    list1.putObject(cTID('SCnc'), desc4);
    var desc5 = new ActionDescriptor();
    desc5.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC28'));
    list1.putObject(cTID('SCnc'), desc5);
    var desc6 = new ActionDescriptor();
    desc6.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list1.putObject(cTID('SCnc'), desc6);
    var desc7 = new ActionDescriptor();
    desc7.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list1.putObject(cTID('SCnc'), desc7);
    var desc8 = new ActionDescriptor();
    desc8.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list1.putObject(cTID('SCnc'), desc8);
    desc2.putList(cTID('olNC'), list1);
    desc2.putBoolean(cTID('obIA'), false);
    desc2.putString(cTID('obIP'), "");
    desc2.putEnumerated(cTID('obCS'), cTID('STcs'), cTID('CS01'));
    var list2 = new ActionList();
    var desc9 = new ActionDescriptor();
    desc9.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC01'));
    list2.putObject(cTID('SCnc'), desc9);
    var desc10 = new ActionDescriptor();
    desc10.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC20'));
    list2.putObject(cTID('SCnc'), desc10);
    var desc11 = new ActionDescriptor();
    desc11.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC02'));
    list2.putObject(cTID('SCnc'), desc11);
    var desc12 = new ActionDescriptor();
    desc12.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC19'));
    list2.putObject(cTID('SCnc'), desc12);
    var desc13 = new ActionDescriptor();
    desc13.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC06'));
    list2.putObject(cTID('SCnc'), desc13);
    var desc14 = new ActionDescriptor();
    desc14.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list2.putObject(cTID('SCnc'), desc14);
    var desc15 = new ActionDescriptor();
    desc15.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list2.putObject(cTID('SCnc'), desc15);
    var desc16 = new ActionDescriptor();
    desc16.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC24'));
    list2.putObject(cTID('SCnc'), desc16);
    var desc17 = new ActionDescriptor();
    desc17.putEnumerated(cTID('ncTp'), cTID('STnc'), cTID('NC22'));
    list2.putObject(cTID('SCnc'), desc17);
    desc2.putList(cTID('ovNC'), list2);
    desc2.putBoolean(cTID('ovCM'), false);
    desc2.putBoolean(cTID('ovCW'), false);
    desc2.putBoolean(cTID('ovCU'), true);
    desc2.putBoolean(cTID('ovSF'), true);
    desc2.putBoolean(cTID('ovCB'), true);
    desc2.putString(cTID('ovSN'), "images");
    desc1.putObject(cTID('Usng'), sTID("SaveForWeb"), desc2);
    executeAction(cTID('Expr'), desc1, dialogMode);
};


String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.replaceAll = function(find, replace) {
    var str = this;
    log("--");
    log(str);
    return str.replace(find, replace);
};

main()