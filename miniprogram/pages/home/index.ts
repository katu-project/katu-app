import { loadData, debounce } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { getCardManager } from '@/controller/card'
const app = getAppManager()
const cardManager = getCardManager()
const user = getUserManager()

Page({
  data: {
    cateList: [],
    likeList: [],
    notice: {
      _id: '',
      content: '暂无新消息',
      updateTime: '',
      auto_show: false
    },
    isRefresh: false
  },

  async onLoad() {
    app.on('cardChange',this.onEventCardChange)
    app.on('cardDelete',this.onEventCardDelete)
    app.on('cardDecrypt',this.onEventCardChange)
    app.on('cardHide',this.onEventCardHide)
    app.on('loginChange',this.onEventLoginChange)

    await loadData(app.loadUser,{},'加载用户信息')
    // 检测切换账号行为，清理缓存数据
    await app.checkLastLogin()
    if(user.isOk){
      app.loadGlobalTask()
      await this.loadData()
      app.checkQuotaNotice('可用兔币不足，请及时处理')
      
      if(app.isMp){
        app.checkUserPrivacy().then((res)=>{
          console.debug('getPrivacySetting:',res)
          if(res && res.needAuthorization){
            this.loadShowUserPrivacy(res.privacyContractName)
          }
        })
      }
    }else{
      if(!user.isActive){
        app.showActiveNotice(true, '现在激活账户可领取免费兔币')
        return
      }
    }
    this.loadNotice()
  },

  onUnload(){
    this.removeAllEvent()
  },

  removeAllEvent(){
    app.off('cardChange',this.onEventCardChange)
    app.off('cardDelete',this.onEventCardDelete)
    app.off('cardDecrypt',this.onEventCardChange)
    app.off('cardHide',this.onEventCardHide)
  },

  async onShow() {
    this.setTabState()
    this.loadNotice()
  },

  async onReady() {
  },

  loadShowUserPrivacy(privacyContractName){
    loadData(app.getUserPrivacyNotice,{},{returnFailed:true}).then(privacy=>{
      if(privacy){
        this.setData({
          showPrivacy: true,
          privacy: {
            title: privacyContractName || privacy.title || '用户隐私协议授权',
            content: privacy.content,
            updateTime: privacy.date
          }
        })
      }
    }).catch(console.log)
  },

  tapToOpenUserPrivacy(){
    this.setData({
      clickOpenUserPrivacy: true
    })
    return app.openUserPrivacyProtocol()
  },

  async handleAgreePrivacyAuthorization(){
    this.setData({
      showPrivacy: false
    })
  },

  async loadData(forceUpdate?:boolean, hideLoading?:boolean){
    const {likeList, cateList} = await loadData(
      app.getHomeData,
      {
        forceUpdate
      },
      hideLoading ? {
        hideLoading
      } : '加载卡片数据')
    
    const setData = {}

    setData['cateList'] = cateList

    setData['likeList'] = likeList.map(card=>{
      card._url = app.getConst(card.encrypted ? 'DefaultShowLockImage' : 'DefaultShowImage')
      return card
    })
    this.setData(setData)
    
    if(likeList.length){
      this.renderLikeCardImage()
    }
  },

  async onEventLoginChange(login){
    if(login){
      this.loadData(true,true)
    }else{
      this.setData({
        cateList: [],
        likeList: [],
        notice: {
          content: ''
        }
      })
    }
  },
  // 修改名称，图片，喜爱
  // 新增卡片
  async onEventCardChange(card){
    const idx = this.data.likeList.findIndex(e=>e._id === card._id)
    const findCard = this.data.likeList[idx]
    console.log('home page: onEventCardChange:', card._id, card.title)
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
    app.deleteHomeDataCache()
  },

  onEventCardHide(id){
    const idx = this.data.likeList.findIndex(e=>e._id === id)
    const findCard = this.data.likeList[idx]
    console.log('home page: onEventCardHide:', id, findCard.title)
    if(findCard){
      const setData = {}
      setData[`likeList[${idx}]._url`] = app.getConst('DefaultShowLockImage')
      setData[`likeList[${idx}]._showEncryptIcon`] = false
      this.setData(setData)
    }
  },

  onEventCardDelete(card){
    const idx = this.data.likeList.findIndex(e=>e._id === card._id)
    if(idx !== -1){
      this._removeLikeListCard(idx)
      console.log('静默移除卡片：',card._id)
    }
    // 更新cataList数据
    this.renderCateList(card, true)
    app.deleteHomeDataCache()
  },

  renderLikeCard(card:ICard){
    const setData = {}
    let idx = this.data.likeList.findIndex(e=>e._id === card._id)
    if(idx === -1){
      idx = this.data.likeList.length
      for (const i in this.data.likeList) {
        setData[`likeList[${+i+1}]`] = this.data.likeList[i]
      }
      setData[`likeList[0]`] = {
        encrypted: card.encrypted,
        image: [card.image[0]],
        title: card.title,
        _id: card._id,
        _url:  app.getConst(card.encrypted ? 'DefaultShowLockImage' : 'DefaultShowImage')
      }
    }else{
      const oldCard = this.data.likeList[idx]
      if(oldCard.title !== card.title){
        setData[`likeList[${idx}].title`] = card.title
      }
      if(oldCard.image[0].hash !== card.image[0].hash){
        setData[`likeList[${idx}].image`] = card.image
        setData[`likeList[${idx}]._url`] = app.getConst(card.encrypted ? 'DefaultShowLockImage' : 'DefaultShowImage')
      }
    }
    if(Object.keys(setData).length) this.setData(setData)
  },

  async renderLikeCardImage(card?:ICard){
    if(card){
      let idx = this.data.likeList.findIndex(e=>e._id === card._id)
      if(idx === -1){
        idx = this.data.likeList.length
      }
      const setData = await cardManager.getImageRenderSetData({idx, card, keyName: 'likeList'})
      if(Object.keys(setData).length) this.setData(setData)
    }else{
      const advSetData = app.createAdvSetData(this.setData.bind(this), this.data.likeList.length)
      for (const idx in this.data.likeList) {
        const card = this.data.likeList[idx]
        cardManager.getImageRenderSetData({idx, card, keyName: 'likeList'})
                   .then(advSetData)
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
        const { cateList } = await app.getHomeData({getCateList:true})
        setData['cateList'] = cateList
      } catch (error) {
        console.error('renderCateList getHomeData:', error)
      }
    }
    
    if(Object.keys(setData).length){
      console.log('renderCateList setData:',setData)
      this.setData(setData)
    }
  },

  async loadNotice(forceFetch?:boolean){
    // 未获取到用户信息，未激活，有未读消息 三种情况跳过
    if(!user.id) return

    if(!user.isActive){
      return
    }

    if(this.data.notice._id) return

    return app.fetchNotice(forceFetch).then(notice=>{
      if(!notice) return
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

  tapToMarkRead: debounce(async function({currentTarget:{dataset:{key}}}){
    await user.markDocRead(key)
    this.setData({
      'notice._id': ''
    })
    this.hideModal('showNotice')
    this.loadNotice(true)
  },1000,{leading: true, trailing: false}),
 
  tapToHideModal(e){
    this.hideModal(e.currentTarget.dataset.name)
  },

  tapToSearch(){
    return app.goCardListPage()
  },

  tapToShowNotice(){
    if(this.data.notice._id){
      const data = {showNotice: true}
      this.setData(data)
    }else{
      app.goNoticePage()
    }
  },

  tapToCardList(e){
    const { tag } = e.currentTarget.dataset
    return app.goCardListPage(tag)
  },

  async tapToCardDetail(e){
    await app.checkQuotaNotice()
    app.goCardDetailPage(e.currentTarget.dataset.item._id)
  },

  onBindRefresh(){
    if(!user.isOk){
      setTimeout(()=>{
        this.setData({
          isRefresh: false
        })
      },300)
      return
    }
    this.loadData(true).then(()=>{
      this.setData({
        isRefresh: false
      })
    })
  },

  onBindLoadError(e){
    this.setData({
      [`likeList[${e.currentTarget.dataset.idx}]._url`]: app.getConst('DefaultLoadFailedImage')
    })
  },

  setTabState(){
    this.getTabBar().setData({selected: 0})
  },

  onShareAppMessage(){
    return app.shareInfo
  },
  
  hideModal(name){
    this.setData({
      [name]: false
    })
  }
})