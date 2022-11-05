import { DefaultShowLockImage, DefaultShowImage } from '@/const'
import { showChoose, showError, loadData, navigateBack, setClipboardData, navigateTo } from '@/utils/index'
import api from '@/api'
import { getCardManager } from '@/class/card'
import { getAppManager } from '@/class/app'
const app = getAppManager()

export {}

Page({
  id: '',
  chooseIdx: 0,
  data: {
    showInputKey: false,
    card: {
      _id: '',
      title: '',
      tags: [],
      setLike: false,
      encrypted: false,
      image: [
        {
          _url: DefaultShowImage
        }
      ]
    }
  },
  onLoad(options) {
    if(options.id){
      this.id = options.id
    }
  },
  async onReady() {
    if(!this.id) {
      showError("卡片不存在")
      return
    }

    const card = await loadData(api.getCard,{
      _id: this.id
    })

    this.setData({
      'card._id': card._id,
      'card.encrypted': card.encrypted,
      'card.title': card.title,
      'card.tags': card.tags,
      'card.info': card.encrypted ? [] : this.rebuildLabel(card.info||[]),
      'card.setLike': card.setLike || false,
      'card.image': card.image.map(pic=>{
        pic._url = pic.url
        if(card.encrypted) pic._url = DefaultShowLockImage
        return pic
      })
    })

    if(this.data.card.encrypted){
      this.showEncryptedImage()
    }
  },
  onShow() {
  },
  onUnload(){
  },
  tapToSetLike(){
    const state = !this.data.card.setLike
    loadData(api.setCardLike,{id:this.id,state}).then(()=>{
      this.setData({
        'card.setLike': state
      })
      app.setHomeRefresh()
    })
  },
  async tapToChoosePic(e){
    this.chooseIdx = e.currentTarget.dataset.index
    const image = this.data.card.image[this.chooseIdx]
    if(!this.data.card.encrypted || image._url !== DefaultShowLockImage){
      return this.previewImage(this.chooseIdx)
    }
    this.showEncryptedImage()
  },
  async showEncryptedImage(){
    const image = this.data.card.image[this.chooseIdx]
    const cardManager = getCardManager()
    try {
      app.checkMasterKey()
    } catch (error) {
      if(error.code[0] === '2'){
        this.showInputKey()
      }else{
        showChoose('解密卡片出错',error.message)
      }
      return
    }

    const imageData = await loadData(cardManager.getCard, image, '解码中')
    
    const setData = {
      [`card.image[${this.chooseIdx}]._url`]: imageData.imagePath,
      [`card.info`]: this.rebuildLabel(imageData.extraData)
    }
    this.setData(setData)
  },
  async previewImage(idx=0){
    const pics = this.data.card.image.filter(e=>e._url !== DefaultShowLockImage).map(e=>e._url)
    wx.previewImage({
      urls: pics,
      current: pics[idx]
    })
  },
  tapToEditCard(){
    navigateTo(`../add/index?id=${this.id}`)
  },
  tapToCopyValue(e){
    setClipboardData(e.currentTarget.dataset.value)
  },
  tapToDeleteCard(){
    showChoose("确认删除卡片","卡片删除后不可恢复！").then(({cancel})=>{
      if(cancel) return

      loadData(api.deleteCard,{_id: this.id}).then(()=>{
        app.setHomeRefresh()
        navigateBack({ refresh: true })
      })
    })
  },
  showInputKey(){
    this.setData({
      showInputKey: true
    })
  },
  inputKeyConfirm(e){
    const key = e.detail.value
    app.loadMasterKeyWithKey(key).then(()=>{
      this.showEncryptedImage()
    }).catch(error=>{
      showError(error.message)
      this.showInputKey()
    })
  },
  rebuildLabel(meta){
    return meta.map(item=>{
      let label = app.Config.extraDataLabels.find(e=>e.key===item[0])
      label = Object.assign({name: '未知', value: '无'},label)
      label.value = item[1]
      return label
    })
  }
})