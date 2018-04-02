import { WORDIcon, TEXTIcon, PDFIcon, PPTIcon, EXCELIcon, VIDEOIcon, UNKNOWNIcon, IMGIcon } from 'svg'
import React from 'react'

export function getFileIcon(filename) {
  const fileType = filename.split('.').pop()

  switch (fileType){
    case 'jpeg':
    case 'jpg':
    case 'png':
    case 'gif':
      return <IMGIcon />
    case 'pdf':
      return <PDFIcon/>
    case 'ppt':
      return <PPTIcon/>
    case 'xls':
    case 'xlsx':
      return <EXCELIcon/>
    case 'txt':
      return <TEXTIcon/>
    case 'doc':
    case 'docx':
      return <WORDIcon/>
    case 'avi':
    case 'mp4':
    case 'mov':
    case 'wmv':
    case 'mkv':
    case 'mpg':
    case 'rmvb':
    case 'rm':
    case 'asf':
    case 'mpeg':
      return <VIDEOIcon/>
    default:
      return <UNKNOWNIcon/>
  }
}
