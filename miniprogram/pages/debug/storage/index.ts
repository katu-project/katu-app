import { file } from '@/utils/index'
import { APP_TEMP_DIR } from '@/const'

export {}

Page({
  data: {
    list:[]
  },
  onLoad(options) {

  },
  async onReady() {
    const files = await file.getSavedFileList()
    console.log(files);
    const dir = await file.getStats(APP_TEMP_DIR, true)
    this.setData({
      list: dir
    })
    console.log(dir);
  }
})