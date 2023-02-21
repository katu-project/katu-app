import { loadData, navigateTo, createAdvSetData } from '@/utils/index'
import { DefaultShowLockImage, DefaultShowImage, APP_ENTRY_PATH, DefaultLoadFailedImage } from '@/const'
import api from '@/api'
import { getAppManager } from '@/class/app'
import { getUserManager } from '@/class/user'
import { getCardManager } from '@/class/card'
const app = getAppManager()
const cardManager = getCardManager()
const user = getUserManager()

Page({
  data: {
    cateList: [] as ICardSummary[],
    likeList: [] as ICard[],
    notice: {
      _id: '',
      content: '暂无新消息',
      updateTime: '',
      auto_show: false
    } as INotice,
    isRefresh: false
  },

  async onLoad() {
    app.on('cardChange',this.onEventCardChange)
    app.on('cardDelete',this.onEventCardDelete)
    app.on('cardDecrypt',this.onEventCardChange)
    // 加载用户信息需要在一开始，加载图片判断自动显示需要检查用户配置
    await loadData(user.init,{},'加载用户信息')
    await this.loadData()
    if(!user.isActive){
      app.showActiveNotice('现在激活账户可领取免费兔币')
    }else{
      this.loadNotice()
    }
  },
  onUnload(){
    app.off('cardChange',this.onEventCardChange)
    app.off('cardDelete',this.onEventCardDelete)
    app.off('cardDecrypt',this.onEventCardChange)
  },

  async onShow() {
    this.setTabState()
    setTimeout(()=>{
      this.loadNotice()
    },2000)
  },

  async onReady() {
  },

  async loadData(){
    let { likeList, cateList } = await loadData(api.getHomeData,{},'加载数据中')
    const setData = {}

    if(cateList.length){
      setData['cateList'] = cateList
    }else{
      setData['cateList'] = []
    }

    if(likeList.length){
      setData['likeList'] = likeList.map(card=>{
        card._url = card.encrypted ? DefaultShowLockImage : DefaultShowImage
        return card
      })
    }

    this.setData(setData)
    
    if(likeList.length){
      this.renderLikeCardImage()
    }
  },
  // 修改名称，图片，喜爱
  // 新增卡片
  async onEventCardChange(card){
    const idx = this.data.likeList.findIndex(e=>e._id === card._id)
    const findCard = this.data.likeList[idx]
    console.log('home page: update card info:', card._id, card.title);
    if(findCard){
      if(card.setLike){
        this.renderLikeCard(card)
        this.renderLikeCardImage(card)
      }else{
        this._removeLikeListCard(idx)
      }
    }else{
      if(card.setLike){ // 新增like状态卡片
        this.renderLikeCard(card)
        this.renderLikeCardImage(card)
      }
    }
    this.renderCateList(card)
  },
  onEventCardDelete(card){
    const idx = this.data.likeList.findIndex(e=>e._id === card._id)
    if(idx !== -1){
      this._removeLikeListCard(idx)
      console.log('静默移除卡片：',card._id)
    }
    // 更新cataList数据
    this.renderCateList(card, true)
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
    if(card){
      let idx = this.data.likeList.findIndex(e=>e._id === card._id)
      if(idx === -1){
        idx = this.data.likeList.length
      }
      this.setData(await cardManager.getImageRenderSetData(idx, card, 'likeList'))
    }else{
      const advSetData = createAdvSetData(this.setData.bind(this), this.data.likeList.length)
      for (const idx in this.data.likeList) {
        const card = this.data.likeList[idx]
        cardManager.getImageRenderSetData(idx, card, 'likeList').then(advSetData)
      }
    }
  },
  async renderCateList(card?:ICard, remove?:boolean){
    console.log('renderCateList card tags:',card?.tags)
    const setData = {}
    if(remove){
      card?.tags.map(tag=>{
        const idx = this.data.cateList.findIndex(e=> e && e.name === tag)
        const count = this.data.cateList[idx].count - 1
        if(count === 0){
          if(this.data.cateList.length === 1){ // 特殊情况：最后一个分类且没有卡片时，直接对cateList置空
            setData[`cateList`] = []
          }else{
            setData[`cateList[${idx}]`] = null
          }
        }else{
          setData[`cateList[${idx}].count`] = count
        }
      })
    }else{ // 卡片新增，内容更新，无法判断tag变化，直接请求对应接口获取数据
      try {
        setData['cateList'] = await api.getCardSummary()
      } catch (error) {}
    }
    
    if(Object.keys(setData).length){
      console.log('renderCateList setData:',setData)
      this.setData(setData)
    }
  },
  async loadNotice(){
    if(!user.isActive || this.data.notice._id) return
    return api.getNotice().then(notice=>{
      if(!notice._id) return 
      notice.updateTime = notice.updateTime.slice(0,10)
      this.setData({
        notice
      })
      if(notice.auto_show){
        this.tapToShowNotice()
      }
    }).catch(console.warn)
  },
  _removeLikeListCard(idx:number){
    this.data.likeList.splice(idx,1)
    this.setData({
      likeList: this.data.likeList
    })
  },
  async tapToMarkRead({currentTarget:{dataset:{key}}}){
    await api.markRead(key)
    this.setData({
      'notice._id': ''
    })
    this.hideModal('showNotice')
    this.loadNotice()
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
      navigateTo('../notice/index')
    }
  },
  tapToCardList(e){
    navigateTo('../card/list/index?tag='+e.currentTarget.dataset.tag, true)
  },
  tapToCardDetail(e){
    navigateTo(`/pages/card/detail/index?id=${e.currentTarget.dataset.item._id}`)
  },
  onBindRefresh(){
    this.loadData().then(()=>{
      this.setData({
        isRefresh: false
      })
    })
  },
  onBindLoadError(e){
    this.setData({
      [`likeList[${e.currentTarget.dataset.idx}]._url`]: DefaultLoadFailedImage
    })
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