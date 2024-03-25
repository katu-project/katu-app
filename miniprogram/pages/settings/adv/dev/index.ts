import { file } from "@/utils/index"

Page({
  data: {
    showText: false,
    text: ''
  },
  async tapToOpenLog(){
    const logfile = `${wx.env.USER_DATA_PATH}/err.log`
    const text = await file.readFile<string>(logfile)
    this.setData({
      showText: true,
      text,
    })
  }
})