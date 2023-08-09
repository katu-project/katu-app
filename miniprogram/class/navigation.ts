import Agent from "./agent";
import { navigateTo, switchTab, navigateBack } from '@/utils/index'

export default class Navigation extends Agent {

  // 导航
  navigateBack(){
    return navigateBack()
  }

  async reLaunch(path?:string){
    return wx.reLaunch({
      url: path || `/pages/${this.getConfig('appEntryPagePath')}`,
    })
  }

  goToPage(page:string, params?:string, vibrate?:boolean){
    const pagePath = `${page.startsWith('/') ? '':'/pages/'}${page}${params? `?${params}`:''}`
    return navigateTo(pagePath, vibrate || false)
  }

  navToDocPage(id){
    return this.goToPage('qa/detail/index',`id=${id}`)
  }

  async goToUserProfilePage(vibrate?:boolean){
    return switchTab('/pages/profile/index', vibrate)
  }

  async goToHomePage(vibrate?:boolean){
    return switchTab('/pages/home/index', vibrate)
  }

  // edit page nav
  goCardEditPage(id:string, vibrate?:boolean){
    return this.goToPage('card/edit/index',`id=${id}`, vibrate)
  }

  goEditImagePage(picPath?:string){
    return this.goToPage('card/image-processor/index',`value=${picPath}`)
  }

  goEditContentPage(content?:string){
    return this.goToPage('card/edit-content/index',`value=${content}`)
  }

  goEditExtraDataPage(content?:string, tag?:string){
    return this.goToPage('card/edit-extra/index',`value=${content}&tag=${tag}`)
  }

  goEditTagPage(){
    return this.goToPage('card/edit-tag/index')
  }

  // home page nav
  goCardDetailPage(id?:string){
    return this.goToPage('card/detail/index',`id=${id||''}`)
  }

  goCardListPage(tag?:string){
    return this.goToPage('card/list/index',`tag=${tag||''}`, true)
  }

  goNoticePage(){
    return this.goToPage('notice/index')
  }

  // settings page nav
  goEditMasterKeyPage(){
    return this.goToPage('settings/security/master-key/index')
  }

  goResetKeyPage(){
    return this.goToPage('settings/security/reset-key/index')
  }

  goResetKeyByQrcodePage(){
    return this.goToPage('settings/security/reset-key/qrcode/index')
  }

  // quota page nav
  goQuotaDetailPage(id:string){
    return this.goToPage('quota/detail/index',`id=${id||''}`)
  }

  // qa doc page nav
  goDocListPage(cate?:string){
    return this.goToPage('qa/list/index',`cate=${cate||''}`)
  }

  goDocDetailPage(id?:string){
    return this.goToPage('qa/detail/index',`id=${id||''}`)
  }

  // user profile nav
  goProfileEditPage(){
    return this.goToPage('profile/edit/index')
  }

  // about katu
  goContactUsPage(){
    return this.goToPage('about/contact/index')
  }

  goChangeLogPage(){
    return this.goToPage('change-log/index')
  }

  // open app doc
  openUserUsageProtocol(){
    return this.navToDocPage(this.navDocMap.userUsageProtocol)
  }

  openUserPrivacyProtocol(){
    return this.navToDocPage(this.navDocMap.userPrivacyProtocol)
  }

  openDataSaveSecurityNoticeDoc(){
    return this.navToDocPage(this.navDocMap.dataSaveSecurityNotice)
  }

  openDataShareDoc(){
    return this.navToDocPage(this.navDocMap.dataShareNotice)
  }

  openDataCheckDoc(){
    return this.navToDocPage(this.navDocMap.dataCheckNotice)
  }

  openInternalApiNotice(){
    return this.navToDocPage(this.navDocMap.imageProcessorTip_1)
  }

  openRemoteApiNotice(){
    return this.navToDocPage(this.navDocMap.imageProcessorTip_2)
  }

  openRememberKeyNotice(){
    return this.navToDocPage(this.navDocMap.rememberKeyNotice)
  }

  openMasterKeyNotice(){
    return this.navToDocPage(this.navDocMap.masterKeyNotice)
  }

  openForgetKeyNotice(){
    return this.navToDocPage(this.navDocMap.forgetKeyNotice)
  }

  openTagConflictDoc(){
    return this.navToDocPage(this.navDocMap.tagConflictHelp)
  }
  // open app doc end
}