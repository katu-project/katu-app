import { PACKAGE_VER_LENGTH } from '@/const'
import { file } from '@/utils/index'
import { v0 } from './v0'

const markMap: {[v:string]:CpkVersion} = {
    [v0.mid]: 'v0'
}

const vMap = {
    v0
}

export function getCpk(ver:CpkVersion){
    return vMap[ver] as ICryotoPackage
}

export async function getCpkFromFile(filePath:string){
    const fileSize = await file.getFileSize(filePath)
    const versionMark = await file.readFileByPosition<string>({
      filePath,
      encoding: 'hex',
      position: fileSize - PACKAGE_VER_LENGTH
    })
    if(!markMap[versionMark]) throw Error(`未知加密版本: ${versionMark}`)
    return getCpk(markMap[versionMark])
}