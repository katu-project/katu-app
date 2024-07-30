import Agent from "./agent";
import { navigateTo, navigateBack, openPrivacyContract } from '@/utils/index'

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
    return this.goToPage('profile/index', '', vibrate)
  }

  // edit page nav
  goCardEditPage(id:string, vibrate?:boolean){
    return this.goToPage('card/edit/index',`id=${id}`, vibrate)
  }

  goEditImagePage(picPath?:string){
    return this.goToPage('card/edit-image/index',`value=${picPath}`)
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

  // 尝试打开官方提供的隐私协议，否则退回到有同样内容的隐私文档
  async openUserPrivacyProtocol(){
    try {
      await openPrivacyContract()
    } catch (error) {
      return this.navToDocPage(this.navDocMap.userPrivacyProtocol)
    }
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

  openRememberKeyNotice(){
    return this.navToDocPage(this.navDocMap.rememberKeyNotice)
  }

  openMasterKeyNotice(){
    return this.navToDocPage(this.navDocMap.masterKeyNotice)
  }

  openMiniKeyNotice(){
    return this.navToDocPage(this.navDocMap.miniKeyNotice)
  }

  openForgetKeyNotice(){
    return this.navToDocPage(this.navDocMap.forgetKeyNotice)
  }

  openTagConflictDoc(){
    return this.navToDocPage(this.navDocMap.tagConflictHelp)
  }

  openBindTelDoc(){
    return this.navToDocPage(this.navDocMap.bindTelNotice)
  }

  openUidInfoDoc(){
    return this.navToDocPage(this.navDocMap.uidInfo)
  }
  // open app doc end

  // auth page
  goTelCodeSelectPage(){
    return this.goToPage('common/tel-code/index')
  }
  // auth page end
}