import { loadData, showSuccess, qrcode, showLoading } from "@/utils/index"
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  _canvasCtx: {} as IAnyObject,
  data: {
    setRecoveryKey: false,
    recoveryKeyId: '0000',
    readyExport: false
  },
  
  onLoad() {

  },

  onReady() {
  },

  async onShow() {
    const setData = {
      setRecoveryKey: false,
      recoveryKeyId: ''
    }
    if(user.config?.security.setRecoveryKey){
      setData.setRecoveryKey = user.config.security.setRecoveryKey
    }
    if(user.recoveryKeyPack?.qrId){
      setData.recoveryKeyId = user.recoveryKeyPack.qrId
    }
    this.setData(setData)
    await this.initCanvas()
    this.initCanvasContent(this._canvasCtx)
  },

  async initCanvas(){
    if(this._canvasCtx?.__inited) return this._canvasCtx
    return new Promise((resolve)=>{
      wx.createSelectorQuery()
      .select('#reqrcode')
      .fields({ node: true, size: true })
      .exec((res) => {
          // Canvas 对象
          const canvas = res[0].node
          const renderWidth = res[0].width
          const renderHeight = res[0].height
          // Canvas 绘制上下文
          this._canvasCtx = canvas.getContext('2d')
          // 初始化画布大小
          const dpr = wx.getWindowInfo().pixelRatio
          console.log({dpr,renderWidth,renderHeight});
          canvas.width = renderWidth * dpr
          canvas.height = renderHeight * dpr
          this._canvasCtx.__width = renderWidth
          this._canvasCtx.__height = renderHeight
          this._canvasCtx.scale(dpr,dpr)
          this._canvasCtx.__inited = true
          resolve(this._canvasCtx)
      })
    })
  },

  async initCanvasContent(ctx){
    await showLoading('检查数据',1000)

    this.setCanvasBg(ctx, '#ccefee', this._canvasCtx.__width, this._canvasCtx.__height)
    const textX = this._canvasCtx.__width / 2
    if(!this.data.setRecoveryKey){
      this.drawNotice(ctx, '还未设置主密码重置凭证','red', textX, 135)
      this.drawNotice(ctx, `点击下方按钮开始设置`,'grey',textX, 175)
    }else{
      this.drawNotice(ctx, '已设置过主密码重置凭证','green', textX, 135)
      this.drawNotice(ctx, `凭证ID: ${this.data.recoveryKeyId}`,'green', textX, 175)
    }
  },

  async setCanvasBg(ctx, color, dx, dy){
    ctx.fillStyle = color || '#ccefee'
    ctx.fillRect(0, 0, dx, dy)
  },

  async drawNotice(ctx, text, color, dx, dy){
    ctx.fillStyle = color
    ctx.font = '20px serif'
    ctx.textAlign = 'center'
    ctx.fillText(text, dx, dy)
  },

  async drawRecoveryKey(ctx, qrData){
    const rx = this._canvasCtx.__width/300
    const ry = this._canvasCtx.__height/400
    const id = qrData.i
    const time = qrData.t
    const text = JSON.stringify(qrData)
    
    ctx.fillStyle = '#ccefee';
    ctx.fillRect(0, 0, 300*rx, 400*ry)
    
    ctx.fillStyle = '#f94747'
    ctx.font = '25px serif'
    ctx.textAlign = 'center';
    ctx.fillText('主密码重置凭证', 150*rx, 35*ry)

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(30*rx, 60*ry, 240*rx, 240*ry)

    ctx.strokeStyle = 'green'
    ctx.lineWidth = 2
    ctx.strokeRect(49*rx, 79*ry, 202*rx, 202*ry)
    qrcode({
      x: 50*rx,
      y: 80*ry,
      width: 200*rx,
      height: 200*ry,
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
        console.log('qrcode: ', e)
      }
    })

    ctx.fillStyle = '#5d5d5d'
    ctx.font = '20px serif'
    ctx.textAlign = 'center'
    ctx.fillText(`ID_${id} ${time}`,150*rx, 335*ry)

    const bottomImage = await this.getImageCanvas('../../../../static/qrcode-bottom.png')
    ctx.drawImage(
        bottomImage,
        1,1,
        bottomImage.width - 2, bottomImage.height - 2,
        1+ (this._canvasCtx.__width - bottomImage.width)/2 ,this._canvasCtx.__height - bottomImage.height + 1,
        bottomImage.width - 2, bottomImage.height - 2
    )
  },

  async getImageCanvas(url){
		const image = wx.createOffscreenCanvas({type: '2d'}).createImage()
		await new Promise(function (resolve, reject) {
			image.onload = resolve
			image.onerror = reject
			image.src = url
    })
    return image
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
    await showLoading('请稍等')
    const { keyPack, qrPack } = await app.generateRecoveryKey()
    const canvasCtx = await this.initCanvas()
    await this.drawRecoveryKey(canvasCtx, qrPack)
    await loadData(app.setRecoveryKey, keyPack)
    user.reloadInfo()

    this.setData({
      recoveryKeyId: qrPack.i,
      setRecoveryKey: true,
      readyExport: true
    })
    app.showNotice("请及时导出并妥善保存该凭证。")
  },

  async tapToGenKey(){
    if(this.data.setRecoveryKey){
      await app.showConfirm("生成新凭证会使已有凭证失效",'仍然继续')
    }
    try {
      app.checkMasterKey()
    } catch (error:any) {
      if(error.code[0] === '2'){
        this.showInputKey()
      }else{
        app.showNotice(`主密码错误: ${error.message}`)
      }
      return
    }
    this.genCert()
  },

  async tapToExport(){
    await app.showNotice("请妥善保管该凭证\n否则存在数据泄漏风险！")
    const url = await this.getCanvasImage()
    wx.saveImageToPhotosAlbum({
      filePath: url as string,
      success: ()=>{
        this.setData({
          readyExport: false
        })
        this.initCanvasContent(this._canvasCtx).then(()=>{
          showSuccess("保存成功")
        })
      },
      fail: error => {
        console.log(error)
        app.showNotice("保存失败,请重试")
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
    app.loadMasterKeyWithKey(key).then(()=>{
      this.genCert()
    }).catch(error=>{
      app.showNotice(error.message)
    })
  },
})