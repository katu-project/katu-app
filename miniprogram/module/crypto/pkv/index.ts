import { file } from '@/utils/index'
import v0 from './v0'

const PACKAGE_VER_LENGTH = 8
const CPKMarkMap: {[v:string]:CpkVersion} = {
    [v0.mid]: v0.ver
}

const CPKMap: {[k in CpkVersion]:ICryptoPackage} = {
    v0
}

export function getCpk(ver:CpkVersion){
    return CPKMap[ver]
}

export async function getCpkFromFile(filePath:string){
    const fileSize = await file.getFileSize(filePath)
    const versionMark = await file.readFileByPosition<string>({
      filePath,
      encoding: 'hex',
      position: fileSize - PACKAGE_VER_LENGTH
    })
    if(!CPKMarkMap[versionMark]) throw Error(`未知加密版本: ${versionMark}`)
    return getCpk(CPKMarkMap[versionMark])
}