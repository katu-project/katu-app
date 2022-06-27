const utils = require('../utils/index')
const { cv } = require('../utils/index')
const { KATU_MARK } = require('../const')
const { getAppManager } = require('./app')
const { saveCard } = require('../api')

class CardManager {
  static instance = null

  static async getInstance(){
    if(!this.instance){
      this.instance = utils.selfish(new CardManager())
      await this.instance.init()
    }
    return this.instance
  }

  async init(){
    this.app = await getAppManager()
  }

  async update(card){
    const cardModel = {_id: card._id, encrypted: card.encrypted, image: [], info: {card:null} }
    cardModel.title = card.title || '未命名'
    cardModel.tags = card.tags || ['其他']
    cardModel.setLike = card.setLike
    
    if(cardModel.encrypted){
      this.app.checkMasterKey()
    }

    for (const pic of card.image) {
      let imageData = {url:'',salt:'',hash:''}
      if(cardModel.encrypted){
        if(pic.salt){ // 保持加密
          const imageHash = await this.getHash(pic.url)
          if(pic.hash === imageHash){ //未变动
            console.log('加密图片无变动');
            imageData.hash = pic.hash
            imageData.salt = pic.salt
            imageData.url = pic.originUrl
          }else{ // 有变动
            console.log('加密图片有变动');
            const encryptedData = await this.encryptImage(pic.url)
            imageData.url = await this.upload(encryptedData.imagePath)
            imageData.salt = encryptedData.imageSecretKey
            imageData.hash = imageHash
          }
        }else{ // 开启加密
          console.log('未加密图片开启加密');
          let localTempFile = pic.url
          if(pic.url.startsWith('cloud://')){ // 增加图片 case
            localTempFile = await this.app.downloadFile(pic)
          }
          const imageHash = await this.getHash(localTempFile)
          const encryptedData = await this.encryptImage(localTempFile)
          imageData.url = await this.upload(encryptedData.imagePath)
          imageData.salt = encryptedData.imageSecretKey
          imageData.hash = imageHash
        }
      }else{
        if(pic.salt){ // 取消加密
          console.log('加密图片取消加密');
          const imageHash = await this.getHash(pic.url)
          imageData.salt = ''
          imageData.url = await this.upload(pic.url) // 重新上传图片获取链接
          imageData.hash = imageHash
        }else{  // 未加密
          if(pic.url.startsWith('cloud://')){ // 未变动(一直未使用加密)
            console.log('未加密图片无变动');
            imageData.url = pic.url,
            imageData.hash = pic.hash
          }else{
            console.log('未加密图片有变动');
            const imageHash = await this.getHash(pic.url)
            imageData.url = await this.upload(pic.url)
            imageData.hash = imageHash
          }
        }
      }

      cardModel.image.push(imageData)
    }

    return saveCard(cardModel)
  }

  async add(card){
    const cardModel = {encrypted: card.encrypted, image: [], info: {card:null} }
    cardModel.title = card.title || '未命名'
    cardModel.tags = card.tags || ['其他']
    cardModel.setLike = card.setLike
    
    if(cardModel.encrypted){
      console.log(this.app);
      this.app.checkMasterKey()
    }
    await this.app.checkQuota(cardModel.encrypted)
    
    for (const pic of card.image) {
      let imageData = {url:'',salt:'',hash:''}
      
      if(pic.url.startsWith('cloud://')){
        pic.url = await this.app.downloadFile(pic)
        console.log('发现远程图片，保存到本地');
      }

      const imageHash = await this.getHash(pic.url)

      if(cardModel.encrypted){
        const encrytedPic = await this.encryptImage(pic.url)
        imageData.url = await this.upload(encrytedPic.imagePath)
        imageData.salt = encrytedPic.imageSecretKey
      }else{
        imageData.url = await this.upload(pic.url)
      }
      imageData.hash = imageHash
      cardModel.image.push(imageData)
    }
    return saveCard(cardModel)
  }

  async encryptImage(imagePath){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    const {key:imageKey, salt} = this.generateKeyByMasterKey()
    const encryptedData = utils.crypto.encryptFile(imageHexData, imageKey)
    const flag = '000101'
    const encryptPackage = `${encryptedData}${salt}${flag}${KATU_MARK}`
    console.log('encryptPackage:', encryptPackage.slice(-38),salt);
    const tempFilePath = await utils.file.getTempFilePath(salt,'_enc')
    await utils.file.writeFile(tempFilePath, encryptPackage)
    return {
      imageSecretKey: salt,
      imagePath: tempFilePath
    }
  }

  async decryptImage(card){
    const salt = card.salt
    const decryptImage = {
      imagePath: await utils.file.getTempFilePath(salt,'_dec')
    }

    try {
      await utils.file.checkAccess(decryptImage.imagePath)
      console.log('hit cache decrypted file, reuse it:')
      return decryptImage
    } catch (error) {
      console.log('no cache decrypted file, decrypt it')
    }

    const imageFilePath = await this.app.downloadFile(card)
    const imageHexData = await utils.file.readFile(imageFilePath, 'utf-8')
    const {key:imageKey} = this.generateKeyByMasterKey({salt})
    const encryptedData = imageHexData.slice(0,-38)
    const decryptedData = utils.crypto.decryptFile(encryptedData, imageKey)
    await utils.file.writeFile(decryptImage.imagePath, decryptedData, 'hex')
    return decryptImage
  }

  async getHash(imagePath){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    console.log('getHash: ',imagePath ,imageHexData.length, imageHexData.slice(0,32), imageHexData.slice(-32));
    return utils.crypto.md5(imageHexData)
  }

  async upload(filePath){
    const uploadFileId = `${this.app.Config.uploadCardNamePrefix}/${this.app.user.openid}/${utils.crypto.random(16)}`
    return this.app.uploadFile(filePath, uploadFileId)
  }

  generateKeyByMasterKey(options){
    return utils.crypto.pbkdf2(this.app._masterKey, options)
  }

  async choosePic(...args){
    return this.app.chooseFile(...args)
  }

  async parseCardImageByRemoteApi(imagePath){
    await this.checkImageType(imagePath)
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath: `tmp/pic-${imagePath.slice(-32)}`,
      filePath: imagePath
    })
    const {fileID: fileUrl} = await this.app.api.captureCard(fileID)
    return fileUrl
  }

  async checkImageType(picPath){
    const type = await this.getImageType(picPath)
    if(!this.app.Config.allowUploadImageType.includes(type)) throw Error("该图片类型不支持")
  }

  async getImageType(picPath){
    try {
      const info = await wx.getImageInfo({
        src: picPath,
      })
      return info.type
    } catch (error) {
      console.log('getImageType error :',error);
    }
  }

  async parseCardImageByInternalApi(url){
    const imageData = await this.getImageData(url)
    const src = cv.imread(imageData)
    const cardUrl = await this.detectCardByContour(src)
    return cardUrl
  }
  // 返回图片 ImageData
  async getImageData(url){
    const offscreenCanvas = wx.createOffscreenCanvas({type: '2d'})
		const image = offscreenCanvas.createImage()
		await new Promise(function (resolve, reject) {
			image.onload = resolve
			image.onerror = reject
			image.src = url
    })
		offscreenCanvas.width = image.width;
		offscreenCanvas.height = image.height;
    const ctx = offscreenCanvas.getContext('2d')
    ctx.drawImage(image, 0, 0, image.width, image.height)
    return ctx.getImageData(0, 0, image.width, image.height)
  }
  // 识别卡片返回临时路径
  async detectCardByContour(src){
    function getSize(contour){
        let corner1 = new cv.Point(contour.data32S[0], contour.data32S[1]);
        let corner2 = new cv.Point(contour.data32S[2], contour.data32S[3]);
        let corner3 = new cv.Point(contour.data32S[4], contour.data32S[5]);
        let corner4 = new cv.Point(contour.data32S[6], contour.data32S[7]);

        //Order the corners
        let cornerArray = [{ corner: corner1 }, { corner: corner2 }, { corner: corner3 }, { corner: corner4 }];
        //Sort by Y position (to get top-down)
        cornerArray.sort((item1, item2) => { return (item1.corner.y < item2.corner.y) ? -1 : (item1.corner.y > item2.corner.y) ? 1 : 0; }).slice(0, 5);

        //Determine left/right based on x position of top and bottom 2
        let tl = cornerArray[0].corner.x < cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
        let tr = cornerArray[0].corner.x > cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
        let bl = cornerArray[2].corner.x < cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];
        let br = cornerArray[2].corner.x > cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];

        //Calculate the max width/height
        let widthBottom = Math.hypot(br.corner.x - bl.corner.x, br.corner.y - bl.corner.y);
        let widthTop = Math.hypot(tr.corner.x - tl.corner.x, tr.corner.y - tl.corner.y);
        let theWidth = (widthBottom > widthTop) ? widthBottom : widthTop;
        let heightRight = Math.hypot(tr.corner.x - br.corner.x, tr.corner.y - br.corner.y);
        let heightLeft = Math.hypot(tl.corner.x - bl.corner.x, tr.corner.y - bl.corner.y);
        let theHeight = (heightRight > heightLeft) ? heightRight : heightLeft;
        return [ theWidth,
                theHeight,
                [tl.corner.x, tl.corner.y,
                  tr.corner.x, tr.corner.y,
                  br.corner.x, br.corner.y,
                  bl.corner.x, bl.corner.y]
                ]
    }
    function four_point_transform(src, contour){
        let [theWidth, theHeight, selectedCoords] = getSize(contour)

        if(theWidth<theHeight){
            [theWidth, theHeight] = [theHeight, theWidth]
            selectedCoords = [...selectedCoords.slice(2), ...selectedCoords.slice(0,2)]
        }

        //Transform!
        let finalDestCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, theWidth - 1, 0, theWidth - 1, theHeight - 1, 0, theHeight - 1]);
        let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, selectedCoords);
        let dsize = new cv.Size(theWidth, theHeight);
        let M = cv.getPerspectiveTransform(srcCoords, finalDestCoords)

        let dst = new cv.Mat()
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        M.delete();finalDestCoords.delete();srcCoords.delete()
        return dst
    }
    let originSrc = src.clone()
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

    let ksize = new cv.Size(5, 5)
    cv.GaussianBlur(src, src, ksize, 0, 0, cv.BORDER_DEFAULT)
    cv.threshold(src, src, 150, 255, cv.THRESH_BINARY);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    let sortedCnts = []
    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i)
        let area = cv.arcLength(cnt, true)
        sortedCnts.push({i,area})
        cnt.delete()
    }

    let areaSortedCnts = sortedCnts
                    .sort((a,b)=>a.area-b.area)
                    .slice(-5)
                    .map(e=>contours.get(e.i))
                    .reverse()
    // console.log("检测到轮廓：",areaSortedCnts);
    let poly = new cv.MatVector();
    let idx = -1
    for (const i in areaSortedCnts) {
      let tmp = new cv.Mat();
      let peri = cv.arcLength(areaSortedCnts[i] , true)
      cv.approxPolyDP(areaSortedCnts[i] , tmp, 0.02*peri, true);
      // console.log("轮廓信息：",tmp.rows,tmp);
      if(tmp.rows == 4){
          poly.push_back(tmp)
          const area = cv.contourArea(areaSortedCnts[i])
          const zb = parseFloat((area/(originSrc.rows*originSrc.cols)).toFixed(2))
          console.log(`发现第${+i+1}个4点轮廓: ${area}, 内容占比: ${zb}`);
          if(zb < 0.95 && zb > 0.40){
              idx = poly.size()-1
          }
      }else{
          tmp.delete();
      }
    }

    console.log('poly:',poly,poly.size(),idx);
    if(idx === -1) {
        throw Error("未检测出卡片")
    }

    let rect = four_point_transform(originSrc, poly.get(idx))
    poly.delete();contours.delete(),hierarchy.delete()

    rect = cv.export(rect)

    const imageBuffer = utils.upng.encode([rect.data],rect.cols,rect.rows,0)
    const path = await utils.file.getTempFilePath('1234')
    await utils.file.writeFile(path, imageBuffer)
    return path
  }
}

async function getCardManager(){
  return CardManager.getInstance()
}

module.exports = {
  getCardManager
}