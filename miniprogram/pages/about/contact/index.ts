import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
    email: app.Config.contacts.email
  },
  onLoad() {

  },
  onReady() {

  },
  onShow() {

  }
})