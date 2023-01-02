import api from "@/api";
import { getAppManager } from "@/class/app";
import { getCardManager } from "@/class/card";
import { DefaultShowLockImage } from "@/const";
import { loadData, showChoose, showError } from "@/utils/index";

const app = getAppManager()

Page({
  shareInfo: {
    sid: '',
    sk: '',
    dk: ''
  },
  chooseIdx: 0,
  data: {
    card: {} as Partial<ICard>,
    endTime: 0,
    endTimeText: '**:**'
  },
  onLoad(options) {
    if(!options.sid || !options.sk){
      showError('分享已失效')
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
    const {card,endTime} = await loadData(api.getShareItem, {sid: this.shareInfo.sid, sk: this.shareInfo.sk})

    this.setData({
      'card.encrypted': card.encrypted,
      'card.image': card.image?.map(pic=>{
        pic._url = pic.url
        if(card.encrypted) pic._url = DefaultShowLockImage
        return pic
      }),
      [`card.info`]: app.rebuildExtraFields(card.info || []),
      endTime: Math.floor((new Date(endTime).getTime() - new Date().getTime()) / 1000)
    })
    if(card.encrypted){
      await this.showEncryptedImage()
    }
  },
  async tapToChoosePic(e){
    this.chooseIdx = e.currentTarget.dataset.index
    const image = this.data.card.image![this.chooseIdx]
    if(!this.data.card.encrypted || image._url !== DefaultShowLockImage){
      return this.previewImage(this.chooseIdx)
    }
    this.showEncryptedImage()
  },
  async previewImage(idx=0){
    const pics = this.data.card.image!.filter(e=>e._url !== DefaultShowLockImage).map(e=>e._url!)
    app.previewImage(pics, idx)
  },
  async showEncryptedImage(){    
    if(!this.shareInfo.dk){
      showChoose('警告','未检测到密钥，无法读取数据',{
        confirmText: '输入密钥'
      }).then(res=>{
        if(res.confirm){
          this.showInputKey()
        }
      })
      return
    }
    return loadData(this.decryptImage)
  },
  async decryptImage(){
    const setData = {}

    for (const idx in this.data.card.image!) {
      const image = this.data.card.image[idx]
      const imageData = await getCardManager().decryptImageWithKey(image, this.shareInfo.dk)
      
      setData[`card.image[${idx}]._url`] = imageData.imagePath,
      setData[`card.info`] = app.rebuildExtraFields(imageData.extraData)
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
  showInputKey(){
    this.setData({
      showInputKey: true
    })
  },
  inputKeyConfirm(e){
    const key = e.detail.value
    this.shareInfo.dk = key
    this.showEncryptedImage()
  }
})