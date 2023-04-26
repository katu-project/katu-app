import { convert, file } from "@/utils/index"
import { PACKAGE_VER_LENGTH } from "@/const"

const VERSION_MARK = '0000952700004396'
const metaInfo = {
    salt2: 8,
    flag: 4,
    edl: 4
}
const dataEncryptionAlgorithm = null

async function createPlaintext(imagePath:string, extraData) {
    const image = await file.readFile<string>(imagePath, 'hex')
    return image.concat(extraData)
}

async function separatePlaintext(plaintext, imagePath:string){
    const { edSize } = await _getMetaData(imagePath)
    return {
        image: edSize ? plaintext.slice(0, -edSize) : plaintext,
        extraData: edSize ? plaintext.slice(-edSize) : ''
    }
}

async function createMetaData(salt:string, extraData) {
    const flag = '00000000'
    let edl = '00000000'
    const ed = JSON.stringify(extraData)
    if(ed !== '[]') {
        edl = convert.string2hex(ed).length.toString().padStart(8,'0')
    }
    
    return salt.concat(flag).concat(edl).concat(VERSION_MARK)
}

async function extractEncryptedData(imagePath:string) {
    const { imageSize, edSize } = await _getMetaData(imagePath)
    return file.readFileByPosition<string>({
        filePath: imagePath,
        encoding: 'hex',
        position: 0,
        length: imageSize + edSize
    })
}

async function _getMetaData(filePath:string){
    const fileByteSize = await file.getFileSize(filePath)
    const metaDataLen = Object.values(metaInfo).reduce((a,b)=>a+b)
    const mixDataByteSize = fileByteSize - metaDataLen - PACKAGE_VER_LENGTH
    const metaData = await file.readFileByPosition<string>({
      filePath,
      encoding: 'hex',
      position: mixDataByteSize,
      length: metaDataLen * 2
    })
    const salt = metaData.slice(0, metaInfo.salt2*2)
    const flag = metaData.slice(metaInfo.salt2*2, (metaInfo.salt2+metaInfo.flag)*2)
    const edl = metaData.slice(-metaInfo.edl*2)
    const edSize = parseInt(edl)
    const imageSize = mixDataByteSize * 2 - edSize
    
    return {
      salt,
      flag,
      edl,
      imageSize,
      edSize
    }
}

export const v0 = {
    mid: VERSION_MARK,
    dea: dataEncryptionAlgorithm,
    cpt: createPlaintext,
    cmd: createMetaData,
    eed: extractEncryptedData,
    spt: separatePlaintext
}