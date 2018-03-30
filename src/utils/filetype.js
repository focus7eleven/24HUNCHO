import React from "react";
import {EXCELIcon, IMGIcon, PDFIcon, PPTIcon, TEXTIcon, UNKNOWNIcon, VIDEOIcon, WORDIcon, FOLDERIcon} from "svg";

export const getFileTypeIcon = (type) => {
  switch (type) {
    case FILE_TYPE.FOLDER:
      return <FOLDERIcon/>;
    case FILE_TYPE.EXCEL:
      return <EXCELIcon/>;
    case FILE_TYPE.IMG:
      return <IMGIcon/>;
    case FILE_TYPE.PDF:
      return <PDFIcon/>;
    case FILE_TYPE.WORD:
      return <WORDIcon/>;
    case FILE_TYPE.PPT:
      return <PPTIcon/>;
    case FILE_TYPE.TEXT:
      return <TEXTIcon/>;
    case FILE_TYPE.VIDEO:
      return <VIDEOIcon/>;
    default:
      return <UNKNOWNIcon/>;
  }
}

export const FILE_TYPE = {
  FOLDER: 0,
  EXCEL: 1,
  PDF: 2,
  WORD: 3,
  PPT: 4,
  TEXT: 5,
  VIDEO: 6,
  IMG: 7,
  UNKNOWN: 8
}

const EXTENSION_TABLE = [
  ['xls', 'xlsx'],
  ['pdf'],
  ['doc', 'docx'],
  ['ppt', 'pptx'],
  ['txt'],
  ['avi', 'mp4', 'rmvb', 'mov', 'mpg', 'mpeg', 'wmv', 'mkv', 'vob'],
  ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
];
const FILE_TYPE_TABLE = [FILE_TYPE.EXCEL, FILE_TYPE.PDF, FILE_TYPE.WORD, FILE_TYPE.PPT, FILE_TYPE.TEXT, FILE_TYPE.VIDEO, FILE_TYPE.IMG];

export const getFileType = (fileName) => {
  const extention = /[.]/.exec(fileName) ? /[^.]+$/.exec(fileName).pop() : null;

  if(!extention) {
    return FILE_TYPE.UNKNOWN;
  }

  for(let i = 0; i < EXTENSION_TABLE.length; i++) {
    if(EXTENSION_TABLE[i].includes(extention)) {
      return FILE_TYPE_TABLE[i];
    }
  }

  return FILE_TYPE.UNKNOWN;
}