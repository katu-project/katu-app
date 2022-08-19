const globalData = getApp().globalData
const { drawQrcode } = globalData.utils

Page({
  data: {
  },
  onLoad(options) {

  },
  onReady() {

  },
  onShow() {
    wx.createSelectorQuery()
    .select('#reqrcode') // 在 WXML 中填入的 id
    .fields({ node: true, size: true })
    .exec((res) => {
        // Canvas 对象
        const canvas = res[0].node
        const renderWidth = res[0].width
        const renderHeight = res[0].height
        // Canvas 绘制上下文
        this.ctx = canvas.getContext('2d')
        // 初始化画布大小
        const dpr = wx.getWindowInfo().pixelRatio
        canvas.width = renderWidth * dpr
        canvas.height = renderHeight * dpr
        this.ctx.scale(dpr, dpr)
    })
  },
  tapToExport(){
    console.log('export',this.ctx);
    this.ctx.fillStyle = 'cyan';
    this.ctx.fillRect(0, 0, 300, 300)
    drawQrcode({
      x: 10,
      y: 5,
      width: 200,
      height: 100,
      // canvasId: 'reqrcode',
      ctx: this.ctx,
      text: 'globalData.app.user.config',
      drawDot(row,col,len,dot){
        const tileW = 200 / len
        const tileH = 200 / len
        let c = dot ? '#000000' : '#ffffff'
        const w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW))
        const h = (Math.ceil((row + 1) * tileW) - Math.floor(row * tileW))
        const x = Math.round(col * tileW) + 10
        const y = Math.round(row * tileH) + 5
        if(row==col) {
          console.log(h);
          c = 'red'
        }
        return [x,y,w,h,c]
      },
      // v1.0.0+版本支持在二维码上绘制图片
      // image: {
      //   imageResource: '../../images/icon.png',
      //   dx: 70,
      //   dy: 70,
      //   dWidth: 60,
      //   dHeight: 60
      // }
      callback(...e) {
        // console.log('e: ', e)
      }
    })
  }
})