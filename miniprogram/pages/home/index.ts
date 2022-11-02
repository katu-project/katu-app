import { loadData, navigateTo, showNotice } from '@/utils/index'
import { DefaultShowLockImage, DefaultShowImage, APP_ENTRY_PATH } from '@/const'
import { getAppManager } from '@/class/app'
import api from '@/api'
const app = getAppManager()

Page({
  backData: {
    refresh: false
  },
  data: {
    list: [] as ICardSummary[],
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
  },
  async loadLikeList(){
    // this.setData({
    //   likeList: []
    // })
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
    this.loadImage()
  },
  loadImage(){
    for (const idx in this.data.likeList) {
      const card = this.data.likeList[idx]
      if(!card.encrypted){
        wx.cloud.getTempFileURL({
          fileList: [card.image[0].url]
        }).then(({fileList:[file]})=>{
          const key = `likeList[${idx}]._url`
          this.setData({
            [key]: file.tempFileURL + app.Config.imageMogr2
          })
        })
      }
    }
  },
  async loadCateList(){
    // this.setData({
    //   list: []
    // })
    const list = await loadData(api.getCardSummary)
    this.setData({
      list
    })
  },
  checkDataRefresh(){
    if(this.backData.refresh){
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