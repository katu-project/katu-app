import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
    email: app.getConfig('contacts').email
  },
  onLoad() {

  },
  onReady() {

  },
  onShow() {

  }
})