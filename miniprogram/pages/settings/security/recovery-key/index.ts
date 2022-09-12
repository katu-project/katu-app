import { loadData, showSuccess, showChoose, showError, qrcode } from "@/utils/index"
const globalData = getApp().globalData

export {}

Page({
  _canvasCtx: '',
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
    const setData = {
      setRecoveryKey: false,
      recoveryKeyId: ''
    }
    if(globalData.app.user.config.security.setRecoveryKey){
      setData.setRecoveryKey = globalData.app.user.config.security.setRecoveryKey
    }
    if(globalData.app.user.recoveryKeyPack.qrId){
      setData.recoveryKeyId = globalData.app.user.recoveryKeyPack.qrId
    }
    this.setData(setData)
    this.initCanvasContent()
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
  initCanvasContent(){
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
  async setCanvasBg(ctx, color){
    ctx.fillStyle = color || '#ccefee'
    ctx.fillRect(0, 0, 300, 400)
  },
  async drawNotice(ctx, text, color, h?: number){
    ctx.fillStyle = color
    ctx.font = '20px serif'
    ctx.textAlign = 'center';
    ctx.fillText(text, 150, h || 135)
  },
  async drawRecoveryKey(ctx, qrData){
    const id = qrData.i
    const time = qrData.t
    const text = JSON.stringify(qrData)
    
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
    qrcode({
      x: 50,
      y: 80,
      width: 200,
      height: 200,
      ctx: ctx,
      text: text,
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
    ctx.textAlign = 'center'
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
  async getCanvasImage(){
    return new Promise((resolve,reject)=>{
      wx.createSelectorQuery()
      .select('#reqrcode')
      .fields({ node: true, size: true })
      .exec((res) => {
        wx.canvasToTempFilePath({
          canvas: res[0].node,
          success: ({tempFilePath}) => {
            resolve(tempFilePath)
          },
          fail: reject
        })
      })
    })    
  },
  async genCert(){
    try {
      globalData.app.checkMasterKey()
    } catch (error) {
      if(error.code[0] === '2'){
        this.showInputKey()
      }else{
        showChoose('主密码出错',error.message)
      }
      return
    }
    const qrData = await globalData.app.generateRecoveryKeyQrcodeContent()
    const canvasCtx = await this.initCanvas()
    await this.drawRecoveryKey(canvasCtx, qrData)
    await loadData(globalData.app.createRecoveryKeyPack, qrData)
    globalData.app.reloadUserConfig()

    this.setData({
      recoveryKeyId: qrData.i,
      setRecoveryKey: true,
      readyExport: true
    })
    showChoose("操作成功!","请及时导出并妥善保存该凭证。",{showCancel: false})
  },
  async tapToGenKey(){
    if(this.data.setRecoveryKey){
      const {cancel} = await showChoose("警告！","重新导出新凭证会使已有凭证失效",{confirmText: '仍然继续'})
      if(cancel) return
    }
    this.genCert()
  },
  async tapToExport(){
    const {cancel} = await showChoose("特别提示","请妥善保管该凭证，否则存在数据泄漏风险！")
    if(cancel) return
    const url = await this.getCanvasImage()
    wx.saveImageToPhotosAlbum({
      filePath: url as string,
      success: ()=>{
        this.setData({
          readyExport: false
        })
        this.initCanvasContent()
        showSuccess("保存成功")
      },
      fail: error => {
        console.log(error);
        showError("保存失败！")
      }
    })
  },
  showInputKey(){
    this.setData({
      showInputKey: true
    })
  },
  inputKeyConfirm(e){
    const key = e.detail.value
    globalData.app.loadMasterKeyWithKey(key).then(()=>{
      this.genCert()
    }).catch(error=>{
      showChoose(error.message,'',{showCancel:false})
    })
  },
})