import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
    ccv: {},
    cpk: {}
  },

  onLoad() {

  },

  onReady() {

  },

  onShow() {
    this.setData({
      ccv: app.crypto.getCcv(),
      cpk: app.crypto.getCpk()
    })
  }
})