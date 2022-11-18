import { getAppManager } from '@/class/app'
import utils,{cv, convert, getCache, setCache} from '@/utils/index'
import { KATU_MARK, PACKAGE_TAIL_LENGTH, WX_CLOUD_STORAGE_FILE_HEAD } from '@/const'
import api from '@/api'

class CardManager {
  static instance: CardManager

  app = getAppManager()

  static getInstance(){
    if(!this.instance){
      this.instance = utils.selfish(new CardManager())
      this.instance.init()
    }
    return this.instance
  }

  init(){
  }

  async update(card){
    const cardModel: Partial<ICard> = { image: [] }
    cardModel._id = card._id
    cardModel.encrypted = card.encrypted || false
    cardModel.title = card.title || '未命名'
    cardModel.tags = card.tags || ['其他']
    cardModel.info = card.info || []
    cardModel.setLike = card.setLike || false
    
    for (const idx in card.image) {
      const pic = card.image[idx]
      const imageData = {url:'',salt:'',hash:''}

      // 统一转换成本地资源
      if(pic.url.startsWith(WX_CLOUD_STORAGE_FILE_HEAD)){
        pic.url = await this.app.downloadFile(pic)
      }

      imageData.hash = await this.getHash(pic.url)
      if(cardModel.encrypted){
        const encrytedPic = await this.encryptImage(pic.url, cardModel.info)
        imageData.url = await this.upload(encrytedPic.imagePath)
        imageData.salt = encrytedPic.imageSecretKey
      }else{
        imageData.salt = ''
        imageData.url = await this.upload(pic.url)
      }
      cardModel.image!.push(imageData)
    }

    if(cardModel.encrypted){
      cardModel.info = []
    }

    return api.saveCard(cardModel)
  }

  async add(card){
    const cardModel: Partial<ICard> = { image: [] }
    cardModel.encrypted = card.encrypted || false
    cardModel.title = card.title || '未命名'
    cardModel.tags = card.tags || ['其他']
    cardModel.info = card.info || []
    cardModel.setLike = card.setLike || false
    
    // 提前检查可用额度，避免因为可用额度不足而导致处理卡片数据产生无效的消耗
    await this.app.checkQuota(cardModel.encrypted)
    
    for (const idx in card.image) {
      const pic = card.image[idx]
      const imageData = {url:'',salt:'',hash:''}

      if(pic.url.startsWith(WX_CLOUD_STORAGE_FILE_HEAD)){
        pic.url = await this.app.downloadFile(pic)
      }
      
      imageData.hash = await this.getHash(pic.url)
      if(cardModel.encrypted){
        const encrytedPic = await this.encryptImage(pic.url, cardModel.info)
        imageData.url = await this.upload(encrytedPic.imagePath)
        imageData.salt = encrytedPic.imageSecretKey
      }else{
        imageData.url = await this.upload(pic.url)
      }
      cardModel.image!.push(imageData)
    }

    if(cardModel.encrypted){
      cardModel.info = []
    }

    return api.saveCard(cardModel)
  }

  async getCard(card){
    if(card.salt){
      try {
        return await this.getCardCache(card)
      } catch (error) {
        console.log('未发现缓存数据，开始解密数据')
      }
      return this.decryptImage(card)
    }else{
      return {
        imagePath: card.url,
        extraData: []
      }
    }
  }

  async encryptImage(imagePath: string, extraData?: any[]){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    const {key:imageKey, salt} = this.generateKeyByMasterKey()
    const flag = '00000000'
    const extraDataInfo = this._packExtraData(extraData)
    
    const mixHexData = (imageHexData as string).concat(extraDataInfo.data)
    const encryptedData = utils.crypto.encryptFile(mixHexData, imageKey)
    
    const encryptPackage = encryptedData.concat(salt)
                                        .concat(flag).concat(extraDataInfo.lengthData)
                                        .concat(KATU_MARK)

    console.log('encryptPackage:',encryptedData.length, encryptPackage.slice(-PACKAGE_TAIL_LENGTH), salt);
    const tempFilePath = await this.app.getTempFilePath(salt,'_enc')
    await utils.file.writeFile(tempFilePath, encryptPackage, 'hex')
    return {
      imageSecretKey: salt,
      imagePath: tempFilePath
    }
  }

  async decryptImage(card){
    const salt = card.salt
    const decryptImage:{imagePath: string, extraData: any[]} = {
      imagePath: await this.app.getTempFilePath(salt,'_dec'),
      extraData: []
    }
    
    const imageFilePath = await this.app.downloadFile(card)
    const encryptedHexData = await utils.file.readFile(imageFilePath, 'hex')
    const {key:secretKey} = this.generateKeyByMasterKey({salt})
    // 解密数据
    const metaData = encryptedHexData.slice(-PACKAGE_TAIL_LENGTH)
    const mixHexData = encryptedHexData.slice(0, -PACKAGE_TAIL_LENGTH)

    const decryptedData = utils.crypto.decryptFile(mixHexData, secretKey)
    if(!decryptedData) throw Error("主密码错误")
    // 检测并解密附加数据
    const {data:extraData, dataLength: extraDataLength} = this._unpackExtraData(decryptedData, metaData)
    if(extraDataLength){
      decryptImage.extraData = extraData
      await this.cacheLabelData(decryptImage.imagePath, extraData)
    }
    const imageData = extraDataLength?decryptedData.slice(0, -extraDataLength): decryptedData

    await utils.file.writeFile(decryptImage.imagePath, imageData, 'hex')
    return decryptImage
  }

  _packExtraData(extraData){
    const retDataInfo = {
      data: '',
      lengthData: '00000000'
    }
    extraData = JSON.stringify(extraData)
    if(extraData !== '[]') {
      const hexStr = convert.string2hex(extraData)
      retDataInfo.data = hexStr
      retDataInfo.lengthData = hexStr.length.toString().padStart(8,'0')
    }
    return retDataInfo
  }

  _unpackExtraData(mixHexData, metaData){
    const retDataInfo = {
      dataLength: 0,
      data: []
    }
    const extraDataLength = parseInt(metaData.slice(-24,-16))
    if(extraDataLength){
      retDataInfo.dataLength = extraDataLength
      retDataInfo.data = JSON.parse(convert.hex2string(mixHexData.slice(-extraDataLength)))
    }
    return retDataInfo
  }

  async getCardCache(card){
    const cacheData = {
      imagePath: '',
      extraData: []
    }
    cacheData.imagePath = await this.getCardImagePathCache(card)
    cacheData.extraData = await this.getCacheLabelData(cacheData.imagePath)
    console.log('命中缓存数据: 已经存在相同解密数据')
    return cacheData
  }

  async getCardImagePathCache(card){
    const picPath = await this.app.getTempFilePath(card.salt,'_dec')
    await utils.file.checkAccess(picPath)
    return picPath
  }

  async getHash(imagePath){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    console.log('getHash: ',imagePath ,typeof imageHexData === 'string' ? imageHexData.length: 'ArrayBuffer', imageHexData.slice(0,32), imageHexData.slice(-32));
    return utils.crypto.md5(imageHexData)
  }

  async upload(filePath){
    const uploadFileId = `${this.app.Config.uploadCardNamePrefix}/${this.app.user.openid}/${await utils.crypto.random(16)}`
    return this.app.uploadFile(filePath, uploadFileId)
  }

  generateKeyByMasterKey(options?:any){
    return utils.crypto.pbkdf2(this.app._masterKey, options)
  }

  async parseCardImageByRemoteApi(imagePath){
    await this.checkImageType(imagePath)
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath: `tmp/pic-${imagePath.slice(-32)}`,
      filePath: imagePath
    })
    const {fileID: fileUrl} = await api.captureCard(fileID)
    return fileUrl
  }

  async cacheLabelData(id, data){
    let cacheData = {}
    try {
      cacheData = await getCache(this.app.Constant.CARD_LABEL_CACHE_KEY)
    } catch (error) {
      cacheData = {}
    }

    cacheData[id] = data
    return setCache(this.app.Constant.CARD_LABEL_CACHE_KEY, cacheData)
  }

  async getCacheLabelData(id){
    try {
      const cacheData = await getCache(this.app.Constant.CARD_LABEL_CACHE_KEY)
      return cacheData[id] || []
    } catch (error) {
      return []
    }
  }

  async checkImageType(picPath){
    const type = await utils.file.getImageType(picPath)
    if(!this.app.Config.allowUploadImageType.includes(type)) throw Error("图片类型不支持")
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
        let [theWidth, theHeight, selectedCoords] = getSize(contour) as [theWidth:number,theHeight:number,selectedCoords:number[]]

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

    let sortedCnts: {i:number,area:number}[] = []
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
    const path = await this.app.getTempFilePath('1234')
    await utils.file.writeFile(path, imageBuffer)
    return path
  }
}

function getCardManager(){
  return CardManager.getInstance()
}

export {
  getCardManager
}