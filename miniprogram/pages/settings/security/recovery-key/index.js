const { loadData, showSuccess, navigateTo } = require("../../../../utils/index")
const drawQrcode = require("../../../../utils/qrcode/index")

const globalData = getApp().globalData

Page({
  data: {
    setRecoveryKey: false,
    recoveryKeyId: '0000',
    readyExport: false
  },
  onLoad(options) {

  },
  onReady() {
  },
  onShow() {
    this.setData({
      setRecoveryKey: globalData.app.user.config.security.setRecoveryKey || false
    })
    if(!this.data.setRecoveryKey){
      this.initCanvas().then(ctx =>{
        this.setCanvasBg(ctx, '#ccefee')
        this.drawNotice(ctx, '还未设置主密码重置凭证','red')
        this.drawNotice(ctx, `点击下方按钮开始设置`,'grey',175)
      })
    }else{
      this.initCanvas().then(ctx =>{
        this.setCanvasBg(ctx, '#ccefee')
        this.drawNotice(ctx, '已设置过主密码重置凭证','green')
        this.drawNotice(ctx, `凭证ID: ${this.data.recoveryKeyId}`,'green',175)
      })
    }
  },
  async initCanvas(){
    if(this._canvasCtx) return this._canvasCtx
    return new Promise((resolve)=>{
      wx.createSelectorQuery()
      .select('#reqrcode') // 在 WXML 中填入的 id
      .fields({ node: true, size: true })
      .exec((res) => {
          // Canvas 对象
          const canvas = res[0].node
          // const renderWidth = res[0].width
          // const renderHeight = res[0].height
          // Canvas 绘制上下文
          this._canvasCtx = canvas.getContext('2d')
          // 初始化画布大小
          // const dpr = wx.getWindowInfo().pixelRatio
          // console.log({dpr,renderWidth,renderHeight},this._canvasCtx.canvas);
          // canvas.width = renderWidth * dpr
          // canvas.height = renderHeight * dpr
          // this._canvasCtx.scale(dpr, dpr)
          canvas.width = 300
          canvas.height = 400
          resolve(this._canvasCtx)
      })
    })
  },
  async setCanvasBg(ctx, color){
    ctx.fillStyle = color || '#ccefee'
    ctx.fillRect(0, 0, 300, 400)
  },
  async drawNotice(ctx, text, color, h){
    ctx.fillStyle = color
    ctx.font = '20px serif'
    ctx.textAlign = 'center';
    ctx.fillText(text, 150, h || 135)
  },
  async drawRecoveryKey(ctx, key, id){
    ctx.fillStyle = '#ccefee';
    ctx.fillRect(0, 0, 300, 400)
    
    ctx.fillStyle = '#f94747'
    ctx.font = '25px serif'
    ctx.textAlign = 'center';
    ctx.fillText('主密码重置凭证', 150, 35)

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(30, 60, 240, 240)

    ctx.strokeStyle = 'green'
    ctx.lineWidth = 2
    ctx.strokeRect(49, 79, 202, 202)
    drawQrcode({
      x: 50,
      y: 80,
      width: 200,
      height: 200,
      ctx: ctx,
      text: key,
      background: 'green',
      foreground: '#ccefee',
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

    ctx.fillStyle = '#5d5d5d'
    ctx.font = '20px serif'
    ctx.textAlign = 'center';
    const time = new Date().toLocaleDateString()
    ctx.fillText(`ID_${id} ${time}`,150, 335)

    const bottom = await this.getImageData('../../../../static/qrcode-bottom.png')
    // console.log(bottom,1);
    // ctx.fillStyle = '#ff00ff';
    // ctx.fillRect(0, 350, 300, 10)
    ctx.putImageData(bottom, 0, ctx.canvas.height - bottom.height,1,1,bottom.width-2,bottom.height)
  },
  async getImageData(url){
    const offscreenCanvas = wx.createOffscreenCanvas({type: '2d'})
		const image = offscreenCanvas.createImage()
		await new Promise(function (resolve, reject) {
			image.onload = resolve
			image.onerror = reject
			image.src = url
    })
		offscreenCanvas.width = image.width
    offscreenCanvas.height = image.height
    const ctx = offscreenCanvas.getContext('2d')
    ctx.drawImage(image, 0, 0, image.width, image.height)
    return ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)
  },
  async tapToGenKey(){
    const recoveryKey = globalData.app.generateRecoveryKey()
    const canvasCtx = await this.initCanvas()
    await this.drawRecoveryKey(canvasCtx, recoveryKey, 3454)
    this.setData({
      readyExport: true
    })
  },
  tapToExport(){
    
  }
})