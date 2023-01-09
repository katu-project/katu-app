import { loadData, navigateTo, showNotice } from '@/utils/index'
import { DefaultShowLockImage, DefaultShowImage, APP_ENTRY_PATH, DefaultLoadFailedImage } from '@/const'
import api from '@/api'
import { getAppManager } from '@/class/app'
import { getUserManager } from '@/class/user'
import { getCardManager } from '@/class/card'
const app = getAppManager()
const cardManager = getCardManager()
const user = getUserManager()

Page({
  backData: {
    refresh: false
  },
  data: {
    cateList: [] as ICardSummary[],
    likeList: [] as ICard[],
    notice: {
      _id: '',
      content: '暂无新消息',
      updateTime: '',
      auto_show: false
    } as INotice,
    isRefresh: false,
    curTab: 0
  },

  onLoad() {
    app.on('cardChange',this.silentLoadCardData)
    app.on('cardDelete',this.silentRemoveCardData)
  },
  onUnload(){
    app.off('cardChange',this.silentLoadCardData)
    app.off('cardDelete',this.silentRemoveCardData)
  },
  async onReady() {
    await loadData(user.init,{},'加载用户数据')
    this.loadData()
  },

  onShow() {
    this.setTabState()
    this.checkDataRefresh()
    setTimeout(()=>this.loadNotice(),2000)
  },
  async loadData(){
    await this.loadLikeList()
    await this.loadCateList()
    return
  },
  async loadLikeList(){
    let likeList = await loadData(api.getLikeCard)
    likeList = likeList.map(card=>{
      card._url = card.encrypted ? DefaultShowLockImage : DefaultShowImage
      return card
    })
    this.setData({
      likeList
    })
    return this.renderLikeCardImage()
  },
  async silentLoadCardData(card){
    console.log('home page: update card info:', card._id, card.title);
    if(card.setLike) {
      this.renderLikeCard(card)
      this.renderLikeCardImage(card)
    }
  },
  silentRemoveCardData(id){
    const idx = this.data.likeList.findIndex(e=>e._id === id)
    if(idx !== -1){
      this.data.likeList.splice(idx,1)
      this.setData({
        likeList: this.data.likeList
      })
      console.log('静默移除卡片：',id)
    }
  },
  renderLikeCard(card:ICard){
    const setData = {}
    let idx = this.data.likeList.findIndex(e=>e._id === card._id)
    if(idx === -1){
      idx = this.data.likeList.length
      card._url = card.encrypted ? DefaultShowLockImage : DefaultShowImage
      setData[`likeList[${idx}]`] = card
    }else{
      const oldCard = this.data.likeList[idx]
      if(oldCard.title !== card.title){
        setData[`likeList[${idx}].title`] = card.title
      }
      if(oldCard.image[0].hash !== card.image[0].hash){
        setData[`likeList[${idx}].image`] = card.image
        setData[`likeList[${idx}]._url`] = card.encrypted ? DefaultShowLockImage : DefaultShowImage
      }
    }
    this.setData(setData)
  },
  async renderLikeCardImage(card?:ICard){
    let setData = {}

    const renderImage = async (idx,card:ICard)=>{
      const setData = {}
      if(card.encrypted){
        if(app.user.config?.general.autoShowContent){
          try {
            const picPath = await cardManager.getCardImagePathCache(card.image[0])
            setData[`likeList[${idx}]._url`] = picPath
            setData[`likeList[${idx}]._showEncryptIcon`] = true
          } catch (error) {}
        }
      }else{
        try {
          const tempUrl = await app.getCloudFileTempUrl(card.image[0].url)
          if(tempUrl.startsWith('/')){// 获取云文件链接出错，使用本地占位图片替代      
            setData[`likeList[${idx}]._url`] = tempUrl
            setData[`likeList[${idx}]._mode`] = 'scaleToFill'
          }else{
            setData[`likeList[${idx}]._url`] = tempUrl + app.Config.imageMogr2
          }
        } catch (error) {}
      }
      return setData
    }
        
    if(card){
      let idx = this.data.likeList.findIndex(e=>e._id === card._id)
      if(!idx){
        idx = this.data.likeList.length
      }
      Object.assign(setData, await renderImage(idx, card))
    }else{
      for (const idx in this.data.likeList) {
        const card = this.data.likeList[idx]
        Object.assign(setData, await renderImage(idx, card))
      }
    }
    this.setData(setData)
  },
  async loadCateList(){
    const cateList = await loadData(api.getCardSummary)
    this.setData({
      cateList
    })
  },
  checkDataRefresh(){
    if(this.backData?.refresh){
      this.loadData()
      this.backData.refresh = false
      console.log("刷新数据");
    }
  },
  async loadNotice(){
    return api.getNotice().then(notice=>{
      if(!notice._id) return 
      notice.updateTime = new Date(notice.updateTime).toLocaleDateString()
      this.setData({
        notice
      })
      if(notice.auto_show){
        this.tapToShowNotice()
      }
    }).catch(console.warn)
  },
  tapToMarkRead(){
    if(!this.data.notice._id) {
      return this.hideModal('showNotice')
    }
    api.markRead(this.data.notice._id)
    this.setData({
      'notice._id': ''
    })
    this.hideModal('showNotice')
  },
  tapToHideModal(e){
    this.hideModal(e.currentTarget.dataset.name)
  },
  tapToSearch(){
    navigateTo('../card/list/index', true)
  },
  tapToShowNotice(){
    if(this.data.notice._id){
      const data = {showNotice: true}
      this.setData(data)
    }else{
      showNotice('暂无新通知')
    }
  },
  tapToCardList(e){
    navigateTo('../card/list/index?tag='+e.currentTarget.dataset.tag, true)
  },
  tapToCardDetail(e){
    navigateTo(`/pages/card/detail/index?id=${e.currentTarget.dataset.item._id}`)
  },
  onBindRefresh(e){
    const key = e.currentTarget.dataset.view
    if(key === 'Like'){
      this.loadLikeList().then(()=>{
        this.setData({
          isRefresh: false
        })
      })
    }else{
      this.loadData().then(()=>{
        this.setData({
          isRefresh: false
        })
      })
    }
    
  },
  onBindLoadError(e){
    this.setData({
      [`likeList[${e.currentTarget.dataset.idx}]._url`]: DefaultLoadFailedImage
    })
  },
  onBindscrolltoupper(){
    if(this.data.curTab !== 0){
      this.setData({
        curTab: 0
      })
    }
  },
  onBindscrolltolower(){
    if(this.data.curTab !== 1){
      this.setData({
        curTab: 1
      })
    }
  },
  setTabState(){
    this.getTabBar().setData({selected: 0})
  },
  onShareAppMessage(){
    return {
      title: '卡兔-安全好用的卡片管理助手',
      path: `/pages/${APP_ENTRY_PATH}`,
      imageUrl: '../../static/share.png'
    }
  },
  hideModal(name){
    this.setData({
      [name]: false
    })
  }
})