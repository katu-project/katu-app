import { loadData } from "@/utils/index"
import { getAppManager } from "@/controller/app"
import { getCardManager } from "@/controller/card"
const app = getAppManager()
const cardManager = getCardManager()

Page({
  shareInfo: {
    sid: '',
    sk: '',
    dk: ''
  },
  chooseIdx: 0,
  data: {
    card: {
      image: [
        {
          _url: app.getConst('DefaultShowImage')
        }
      ]
    } as Partial<ICard>,
    endTime: 0,
    endTimeText: '**:**',
    showInputKey: false,
    inputKeyResult: '',
  },
  onLoad(options) {
    if(!options.sid || !options.sk){
      app.showNotice('该分享已经失效')
      return
    }
    if(!this.shareInfo) this.shareInfo = {sid: '',sk: '',dk: ''}
    this.shareInfo.sid = options.sid
    this.shareInfo.sk = options.sk
    this.shareInfo.dk = options.dk || ''
  },
  onReady() {
    this.loadData().then(()=>{
      this.renderTimeInfo()
    })
  },
  onShow() {

  },
  async loadData(){
    const {card,endTime} = await loadData(app.getShareItem, {sid: this.shareInfo.sid, sk: this.shareInfo.sk},'读取分享数据')

    this.setData({
      'card.encrypted': card.encrypted,
      'card.image': card.image?.map(pic=>{
        pic._url = pic.url
        if(card.encrypted) pic._url = app.getConst('DefaultShowLockImage')
        return pic
      }),
      [`card.info`]: cardManager.rebuildExtraFields(card.info || []),
      endTime: Math.floor((new Date(endTime).getTime() - app.currentTimestamp) / 1000)
    })
    if(card.encrypted){
      await this.showEncryptedImage()
    }
  },

  async tapToChoosePic(e){
    this.chooseIdx = e.currentTarget.dataset.index
    const image = this.data.card.image![this.chooseIdx]
    if(!this.data.card.encrypted || image._url !== app.getConst('DefaultShowLockImage')){
      return this.previewImage(this.chooseIdx)
    }
    this.showEncryptedImage()
  },

  async previewImage(idx=0){
    const pics = this.data.card.image!.filter(e=>e._url !== app.getConst('DefaultShowLockImage')).map(e=>e._url!)
    app.previewImage(pics, idx)
  },

  async showEncryptedImage(){    
    if(!this.shareInfo.dk){
      await app.showConfirm('未检测到密钥，无法读取数据','输入密钥')
      return this.showInputKey()
    }
    return loadData(this.decryptImage,{},'读取加密数据')
  },
  
  async decryptImage(){
    const setData = {}

    for (const idx in this.data.card.image!) {
      const image = this.data.card.image[idx]
      const imageData = await getCardManager().decryptImage(image, this.shareInfo.dk)
      
      setData[`card.image[${idx}]._url`] = imageData.imagePath,
      setData[`card.info`] = cardManager.rebuildExtraFields(imageData.extraData)
    }   

    this.setData(setData)
  },

  renderTimeInfo(){
    setTimeout(()=>{
      if(this.data.endTime) {
        const sec = this.data.endTime % 60
        const min = (this.data.endTime - sec) / 60 
        this.setData({
          endTimeText: `${min}:${sec.toString().padStart(2,'0')}`,
          endTime: this.data.endTime - 1
        })
        return this.renderTimeInfo()
      }else{
        this.setData({
          card: {}
        })
      }
    },1000)
  },

  inputKeyConfirm(e){
    const key = e.detail.value
    this.shareInfo.dk = key
    this.hideInputKey()
    setTimeout(()=>{
      this.showEncryptedImage()
    },300)
  },

  showInputKey(){
    this.setData({
      showInputKey: true
    })
  },

  hideInputKey(){
    this.setData({
      showInputKey: false
    })
  },

  tapToForgetKey(){
    app.showNotice('请联系分享人获取密码')
  }
})