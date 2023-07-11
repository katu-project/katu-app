import { loadData } from "@/utils/index"
import { getAppManager } from '@/controller/app'
import { getUserManager } from "@/controller/user"
const app = getAppManager()
const user = getUserManager()
const smsGapTime = app.getConfig('smsGapTime')

Page({
  lastSendTime: 0,
  data: {
    tel: '',
    showTel: '',
    code: '',
    verifyId: '',
    sendCode: false,
    waitTime: 0,
    sendResetTelCode: false
  },

  onShow(){
    this.loadData()
    this.loadWaitTime()
  },

  onUnload(){
    this.cacheWaitTime()
  },

  loadData(){
    if(user.tel){
      this.setData({
        tel: user.tel,
        showTel: user.tel.replace(/^(\d{3}).*(\d{4})$/,'$1****$2'),
        sendCode: false,
        verifyId: '',
        code: '',
        waitTime: 0,
      })
    }else{
      this.setData({
        tel: '',
        showTel: '',
        sendCode: false,
        verifyId: '',
        code: '',
        waitTime: 0,
        sendResetTelCode: false
      })
    }
  },

  onBindInput(){
  },

  async tapToChangeTel(){
    if(this.data.sendResetTelCode){
      if(!await this.smsSendPrecheck()){
        return
      }

      loadData(user.removeBindTelNumber, {
        code: this.data.code,
        verifyId: this.data.verifyId
      }).then(()=>{
        user.reloadInfo().then(()=>{
          this.loadData()
        })
      })
    }else{
      if(this.data.sendCode){
        this.setData({
          sendResetTelCode: true
        })
        app.showNotice('稍后再获取验证码')
        return
      }
      await app.showConfirm('更换手机号需解绑当前号码')
      await this.sendCode(this.data.tel)
      this.setData({
        sendResetTelCode: true
      })
    }
  },

  async tapToSendCode(){
    if(this.data.tel.length !== 11){
      app.showNotice('手机号码有误')
      return
    }
    await this.sendCode(this.data.tel)
    this.lastSendTime = app.currentTimestamp
  },

  async sendCode(tel:string){
    const {verifyId} = await loadData(app.sendVerifyCode, {tel})
    this.setData({
      sendCode: true,
      waitTime: smsGapTime,
      verifyId
    })
    await app.showNotice('验证码已发送')
    this.showWaitTime()
  },

  async tapToBindTel(){
    if(!this.data.sendCode){
      return
    }
    
    if(!await this.smsSendPrecheck()){
      return
    }

    loadData(user.bindTelNumber, {
      code: this.data.code,
      verifyId: this.data.verifyId
    }).then(()=>{
      user.reloadInfo().then(()=>{
        this.loadData()
        app.showNotice('绑定成功')
      })
    })
  },

  async smsSendPrecheck(){
    if(!this.data.code || this.data.code.length !== 4){
      app.showNotice('验证码有误')
      return false
    }

    if(!this.data.verifyId){
      await app.showNotice('验证码失效,请重新发送验证码')
      return false
    }
    return true
  },

  showWaitTime(){
    if(this.data.waitTime>1){
      this.setData({
        waitTime: this.data.waitTime - 1
      })
      setTimeout(()=>{
        this.showWaitTime()
      },1000)
    }else{
      this.setData({
        sendCode: false,
        waitTime: 0
      })
    }
  },

  cacheWaitTime(){
    if(this.data.waitTime){
      app.setLocalData('SMS_LAST_SEND_TIME', this.lastSendTime || app.currentTimestamp - (smsGapTime-this.data.waitTime)*1000)
    }
  },

  loadWaitTime(){
    app.getLastSmsSendTime().then(lastTime=>{
      try {
        const remainSecond = app.checkSmsTimeout(lastTime)
        this.lastSendTime = lastTime
        this.data.waitTime = remainSecond
        this.setData({
          sendCode: true
        })
        this.showWaitTime()
      } catch (_) {}
    })
  }
})