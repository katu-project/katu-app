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
    card: {} as Partial<ICard>
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
    this.loadData()
  },
  onShow() {

  },
  loadData(){
    loadData(api.getShareItem, {sid: this.shareInfo.sid, sk: this.shareInfo.sk}).then(({card,endTime})=>{
      this.setData({
        'card.encrypted': card.encrypted,
        'card.image': card.image?.map(pic=>{
          pic._url = pic.url
          if(card.encrypted) pic._url = DefaultShowLockImage
          return pic
        }),
        [`card.info`]: app.rebuildLabel(card.info),
        endTime: new Date(endTime).toLocaleString()
      })
      if(card.encrypted){
        this.showEncryptedImage()
      }
    })
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
    loadData(this.decryptImage)
  },
  async decryptImage(){
    const setData = {}

    for (const idx in this.data.card.image!) {
      const image = this.data.card.image[idx]
      const imageData = await getCardManager().decryptImageWithKey(image, this.shareInfo.dk)
      
      setData[`card.image[${idx}]._url`] = imageData.imagePath,
      setData[`card.info`] = app.rebuildLabel(imageData.extraData)
    }   

    this.setData(setData)
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