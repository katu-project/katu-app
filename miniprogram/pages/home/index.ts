import { loadData, navigateTo, showNotice } from '@/utils/index'
import { DefaultShowLockImage, DefaultShowImage, APP_ENTRY_PATH } from '@/const'
import api from '@/api'
import { getAppManager } from '@/class/app'
import { getCardManager } from '@/class/card'
const app = getAppManager()
const cardManager = getCardManager()

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
  },

  onReady() {
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
      if(card.encrypted){
        card._url = DefaultShowLockImage
      }else{
        card._url = DefaultShowImage
      }
      return card
    })
    this.setData({
      likeList
    })
    return this.loadImage()
  },
  async loadImage(){
    const setData = {}

    for (const idx in this.data.likeList) {
      const card = this.data.likeList[idx]
      if(card.encrypted){
        if(app.user.config?.general.autoShowContent){
          try {
            const picPath = await cardManager.getCardImagePathCache(card.image[0])
            setData[`likeList[${idx}]._url`] = picPath
          } catch (error) {}
        }
      }else{
        try {
          const tempUrl = await app.getCloudFileTempUrl(card.image[0].url)
          if(tempUrl.startsWith('/')){
            setData[`likeList[${idx}]._url`] = tempUrl
            setData[`likeList[${idx}]._mode`] = 'scaleToFill'
          }else{
            setData[`likeList[${idx}]._url`] = tempUrl + app.Config.imageMogr2
          }
        } catch (error) {}
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