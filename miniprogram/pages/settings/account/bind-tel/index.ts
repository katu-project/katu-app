import { loadData, navigateBack, showError } from "@/utils/index"

import { getAppManager } from '@/class/app'
import { getUserManager } from "@/class/user"
const app = getAppManager()
const user = getUserManager()

Page({
  lastSendTime: 0,
  data: {
    tel: '',
    code: '',
    sendCode: false,
    waitTime: 0
  },
  onShow(){
    this.loadWaitTime()
  },
  onUnload(){
    this.cacheWaitTime()
  },
  onBindInput(){
  },
  tapToSendCode(){
    if(this.data.tel.length !== 11){
      showError('号码有误')
      return
    }
    loadData(app.sendVerifyCode, {tel:this.data.tel}).then(()=>{
      this.setData({
        sendCode: true,
        waitTime: 60
      })
      this.showWaitTime()
    })
  },
  tapToBindTel(){
    if(!this.data.sendCode){
      return
    }
    if(this.data.code.length !== 4){
      showError('验证码错误')
      return
    }

    loadData(user.bindTelNumber, this.data.code).then(()=>{
      user.reloadInfo()
      navigateBack()
    })
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
      app.setLocalData('LastSendCodeTime', this.lastSendTime || new Date().getTime() - (60-this.data.waitTime)*1000)
    }
  },
  loadWaitTime(){
    app.getLocalData<number>('LastSendCodeTime').then(lastTime=>{
      if(lastTime){
        const now = new Date().getTime()
        const remainTime = Math.floor((now - lastTime)/1000)
        if(remainTime < 60){
          this.lastSendTime = lastTime
          this.data.waitTime = 60 - remainTime
          this.setData({
            sendCode: true
          })
          this.showWaitTime()
        }
      }
    })
  }
})