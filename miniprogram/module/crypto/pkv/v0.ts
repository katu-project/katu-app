const PACKAGE_VER_LENGTH = 8
const VERSION_MARK = '0000952700004396'
const metaInfo = {
    salt2: 8,
    flag: 4,
    edl: 4
}
const dataEncryptionAlgorithm = {
    cryptoMethod: 'AES_256_CBC'
}

async function createPlaintext(imageData, extraData) {
    return imageData.concat(extraData)
}

async function separatePlaintext(plaintext, packageHex){
    const { edSize } = await _getMetaData(packageHex)
    return {
        image: edSize ? plaintext.slice(0, -edSize) : plaintext,
        extraData: edSize ? plaintext.slice(-edSize) : ''
    }
}

async function createMetaData(salt, edhl) {
    const flag = '00000000'
    let edl = '00000000'
    if(edhl > 0) {
        edl = edhl.toString().padStart(8,'0')
    }
    return salt.concat(flag).concat(edl).concat(VERSION_MARK)
}

async function extractEncryptedData(imageHexData) {
    const { imageSize, edSize } = await _getMetaData(imageHexData)
    return imageHexData.slice(0, imageSize + edSize )
}

async function _getMetaData(packageHex){
    const fileByteSize = packageHex.length / 2
    const metaDataLen = Object.values(metaInfo).reduce((a,b)=>a+b)
    const mixDataByteSize = fileByteSize - metaDataLen - PACKAGE_VER_LENGTH
    const metaData = packageHex.slice(mixDataByteSize * 2, (mixDataByteSize + metaDataLen) * 2)
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

export default {
    ver: 'v0',
    dea: dataEncryptionAlgorithm,
    cpt: createPlaintext,
    cmd: createMetaData,
    eed: extractEncryptedData,
    spt: separatePlaintext
}