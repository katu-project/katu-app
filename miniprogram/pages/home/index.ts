import { loadData, lodash } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { getCardManager } from '@/controller/card'
import { CreateEventBehavior } from '@/behaviors/event'

const app = getAppManager()
const cardManager = getCardManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['home']
  },

  behaviors: [
    CreateEventBehavior('home')
  ],

  data: {
    cateList: [] as AnyObject[],
    likeList: [] as AnyObject[],
    notice: {
      _id: '',
      content: '',
      updateTime: '',
      auto_show: false
    } as AnyObject,
    isRefresh: false,
    showMenu: true,
    userLoad: false
  },

  async onLoad() {
    await this.loadData({
      cacheOnly: true,
      hideLoading: true
    })
    this.loadUser()
  },

  onUnload(){
  },

  async onShow() {
    this.loadNotice()
  },

  async onReady() {
  },

  async loadUser(){
    await loadData(app.loadUser, undefined, {
      loadingTitle: this.t('load_user_info'),
      timeout: -1
    })
    this.setData({
      userLoad: true
    })
    if(user.isOk){
      app.loadGlobalTask()
      app.checkLikeCardNeedSync().then(needSync=>{
        if(needSync){
          console.debug('update data in background')
          this.loadData({
            forceUpdate: true,
            hideLoading: true
          })
        }
      })
    }else{
      if(app.isMp){
        const {confirm} = await app.showChoose(this.t('signup_gift'),{
          confirmText: this.t('go_sign_up'),
          title: this.t('good_msg')
        })
        if(confirm){
          app.goToUserProfilePage()
        }
      }
    }
    this.loadNotice()
  },

  removeLikeListCard(idx:number){
    this.data.likeList.splice(idx,1)
    this.setData({
      likeList: this.data.likeList
    })
  },

  removeHomeData(){
    this.setData({
      cateList: [],
      likeList: [],
      notice: {
        content: ''
      }
    })
  },

  onEventCacheDelete(){
    this.removeHomeData()
  },

  onEventLoginChange(login){
    if(login){
      this.loadData({
        forceUpdate: true,
        hideLoading: true
      })
    }else{
      this.removeHomeData()
    }
  },

  onEventCardHide(id){
    const idx = this.data.likeList.findIndex(e=>e._id === id)
    const findCard = this.data.likeList[idx]
    console.log('home page: onEventCardHide:', id, findCard?.title || 'skip event')
    if(findCard){
      const setData = {}
      setData[`likeList[${idx}]._url`] = app.getConst('DefaultShowLockImage')
      setData[`likeList[${idx}]._showEncryptIcon`] = false
      this.setData(setData)
    }
  },

  // change title，pic,like
  // add carf
  onEventCardChange(card){
    const idx = this.data.likeList.findIndex(e=>e._id === card._id)
    const findCard = this.data.likeList[idx]
    console.log('home page: onEventCardChange:', card._id, card.title)
    if(findCard){
      if(card.setLike){
        this.renderLikeCard(card)
        this.renderLikeCardImage(card)
      }else{
        this.removeLikeListCard(idx)
      }
    }else{
      if(card.setLike){ // add like state card
        this.renderLikeCard(card)
        this.renderLikeCardImage(card)
      }
    }
    this.renderCateList(card)
    app.deleteHomeDataCache()
  },

  onEventCardDecrypt(card){
    return this.onEventCardChange(card)
  },

  onEventCardDelete(card){
    const idx = this.data.likeList.findIndex(e=>e._id === card._id)
    if(idx !== -1){
      this.removeLikeListCard(idx)
      console.log('remove card in background：',card._id)
    }
    // update cataList
    this.renderCateList(card, true)
    app.deleteHomeDataCache()
  },

  async loadData(options?:{forceUpdate?:boolean, hideLoading?:boolean, cacheOnly?:boolean}){
    const {likeList, cateList} = await loadData(
      app.getHomeData,
      {
        skipCache: options?.forceUpdate,
        cacheOnly: options?.cacheOnly
      },
      options?.hideLoading ? {
        hideLoading: options?.hideLoading
      } : this.t('load_card'))
    
    const setData = {}

    setData['cateList'] = app.buildTagsInfo(cateList)

    setData['likeList'] = likeList.map(card=>{
      card._url = app.getConst(card.encrypted ? 'DefaultShowLockImage' : 'DefaultShowImage')
      return card
    })
    this.setData(setData)
    
    if(likeList.length){
      this.renderLikeCardImage()
    }
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
    const listKey = 'likeList'
    if(card){
      let idx = this.data.likeList.findIndex(e=>e._id === card._id)
      if(idx === -1){
        idx = this.data.likeList.length
      }
      const setData = await cardManager.getImageRenderSetData({idx, card, keyName: listKey})
      if(Object.keys(setData).length) this.setData(setData)
    }else{
      const advSetData = app.createAdvSetData(this.setData.bind(this), this.data.likeList.length)
      for (const idx in this.data.likeList) {
        const card = this.data.likeList[idx] as ICard
        cardManager.getImageRenderSetData({idx, card, keyName: listKey})
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
          if(this.data.cateList.length === 1){ // Special case：last cate and no card，set cateList empty
            setData[`cateList`] = []
          }else{
            setData[`cateList[${idx}]`] = null
          }
        }else{
          setData[`cateList[${idx}].count`] = count
        }
      })
    }else{ // add，update，can't check tag status，reload data with api
      try {
        setData['cateList'] = app.buildTagsInfo(await app.getCateList()) 
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
    // can't get user info, or no active, or has unread msg pass
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

  tapToMarkRead: lodash.debounce(async function(this,{currentTarget:{dataset:{key}}}: any){
    await user.markDocRead(key)
    this.setData({
      'notice._id': ''
    })
    this.hideModal('showNotice')
    this.loadNotice(true)
  },2000,{leading: true, trailing: false}),
 
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
    this.loadData({
      forceUpdate: true
    }).then(()=>{
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

  onShareAppMessage(){
    return app.shareInfo
  },
  
  hideModal(name){
    this.setData({
      [name]: false
    })
  },

  bindscroll: lodash.debounce(async function(this){
    if(!user.config?.ui.homeMainBtnAnimation) return
    this.setData({
      showMenu: true
    })
  },1500),

  onBinddragend(e){
    if(!user.config?.ui.homeMainBtnAnimation) return
    if(!this.data.showMenu) return
    if(!e.detail.velocity) return
    if(e.detail.velocity.y<0 || e.detail.velocity.y>0.5){
      this.setData({
        showMenu: false
      })
    }
  },

  tapToMenu(){
    app.goCardEditPage('', true)
  },

  async tapToProfile(){
    if(!this.data.userLoad){
      await this.loadUser()
    }
    return app.goToUserProfilePage()
  },
})