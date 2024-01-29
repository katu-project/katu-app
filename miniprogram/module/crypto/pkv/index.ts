import { file } from '@/utils/index'
import v0 from './v0'
// cpk 包标志位长度，不能变动
const PACKAGE_SIGN_LENGTH = 8

/**
 * 取 sign 前4位字符转换成数字 0000 -> 0 0001 -> 1 0011 -> 11
 * @param sign 
 * @returns 
 */
function signToImportKey(sign:string){
    return 'v' + parseInt(sign.slice(0,4)).toString()
}

export function getCpk(ver: string): ICryptoPackage{
    if(ver === 'v0') return v0
    const npmCpk = `@katucloud/cpk@v${ver}`
    try {
        const cpk = require(npmCpk)
        console.log(cpk)
        return cpk
    } catch (error) {
        console.log(error)
        throw Error('内部错误102')
    }
}

export async function getCpkFromFile(filePath:string){
    const fileSize = await file.getFileSize(filePath)
    const cpkSign = await file.readFileByPosition<string>({
      filePath,
      encoding: 'hex',
      position: fileSize - PACKAGE_SIGN_LENGTH
    })
    const cpk = signToImportKey(cpkSign)
    console.debug('load cpk :', cpk)
    return getCpk(cpk)
}