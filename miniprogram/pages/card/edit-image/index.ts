import { loadData, sleep } from '@/utils/index'
import { Canvas } from '@/class/canvas'
import { getCardManager } from '@/controller/card'
import { getAppManager } from '@/controller/app'
const globalData = getApp().globalData

const app = getAppManager()
const cardManager = getCardManager()

const StatusConfig = {
  Idle: 0,       //正常状态
  DragStart: 1, //拖拽开始
  Dragging: 2,   //拖拽中
}

type Point = {
  x: number
  y: number
  r?: number,
  f?: number
}

Page({
  canvas: {} as Canvas,
  originRect: [] as Point[],

  image: {width:0,height:0},

  data: {
    navHeight: globalData.CustomBar,
    tmpImagePath: '',
    circles: [] as Point[],
    canvasInfo: {
      imageRotate: 0,
      dragTarget: {} as Point,
      status: 0 as number,
      lastEvtPos: {} as Point
    }
  },

  async onLoad(options) {
    if(options.value){
      this.setData({
        tmpImagePath: options.value
      })
    }else{
      await app.showConfirm('请选择图片')
      app.navigateBack()
      return
    }
  },

  async onReady() {
    this.loadImage()
  },

  async loadImage(){
    const query = wx.createSelectorQuery()
    this.image = await this.getImage(this.data.tmpImagePath)

    query.select('#myCanvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        const { node:canvas, width:realWidth, height:realHeight } = res[0]
        const dpr = wx.getSystemInfoSync().pixelRatio
        let imageRotate = 0
        let imageWidth = this.image.width
        let imageHeight = this.image.height
        console.debug({imageWidth,imageHeight})
        if(imageWidth>imageHeight){
          [imageWidth,imageHeight] = [imageHeight,imageWidth]
          imageRotate = 90
        }
        const radius = imageWidth * 0.03
        this.originRect = [
          {x: 0, y: 0, r: radius},
          {x: imageWidth, y: 0, r: radius},
          {x: imageWidth, y: imageHeight, r: radius},
          {x: 0, y: imageHeight, r: radius}
        ]
        this.setData({
          'canvasInfo.imageRotate': imageRotate,
          circles: JSON.parse(JSON.stringify(this.originRect))
        })

        const realScale = realWidth/realHeight
        const imageScale = imageWidth/imageHeight
        console.debug({realScale,imageScale})
        const trans = {
          x:0,
          y:0,
          xy:1
        }

        const canvasSize = {
          width: imageWidth,
          height: imageHeight
        }
        console.debug('canvas 预设尺寸：',canvasSize.width,canvasSize.height)
        
        // 根据实际显示比例确定画布尺寸
        if(imageScale<realScale){ 
          // 小于 realScale 增加画布宽度
          canvasSize.height = canvasSize.height * 1.1
          canvasSize.width = canvasSize.height * realScale
        }else{ 
          // 大于 realScale 增加画布高度
          canvasSize.width = canvasSize.width * 1.1
          canvasSize.height = canvasSize.width / realScale
        }

        console.debug('canvas 适应显示比例尺寸：',canvasSize.width.toFixed(),canvasSize.height.toFixed())
        
        // 解决小程序canvas尺寸限制4096x4096
        if(canvasSize.height * dpr > 4000){
          const fixHeight = 4000 / dpr
          const fixWidth = fixHeight * realScale
          trans.xy = fixHeight/canvasSize.height
          console.debug('canvas 解决4096限制后的尺寸：',fixWidth.toFixed(),fixHeight.toFixed(), ',缩放比例：', trans.xy.toFixed(2))
          canvasSize.height = fixHeight
          canvasSize.width = fixWidth
        }

        trans.x = Math.floor((canvasSize.width - imageWidth * trans.xy) / 2)
        trans.y = Math.floor((canvasSize.height - imageHeight * trans.xy) / 2)
        canvasSize.height = Math.ceil(canvasSize.height)
        canvasSize.width = Math.ceil(canvasSize.width)

        console.debug('canvas 修正后的最终尺寸：',canvasSize.width,canvasSize.height,dpr)
        this.canvas = new Canvas({
          canvas,
          renderSize: {
            width: realWidth,
            height: realHeight
          },
          canvasSize,
          trans,
          dpr
        })
        this.initCanvas()
      })
  },

  async useImage(url){
    if(app.isMp){
      await app.knowContentCheck()
      await loadData(app.imageContentCheck,{imagePath:url},'内容合规检查')
    }
    app.publishCardEditImageEvent(url)
    app.navigateBack()
  },

  async tapToSelectImage(){
    try {
      const picPath = await app.chooseLocalImage()
      if(!picPath) return
      this.setData({
        tmpImagePath: picPath
      })
      this.loadImage()
    } catch (error:any) {
      app.showNotice(error.message)
    }
  },

  async tapToSelectCanvas() {
    loadData(async ()=>{
      this.initCanvas({noSelect:true})
      const {trans,dpr} = this.canvas.options

      const points = this.data.circles.map(e=>{
        return {
          x: e.x * this.canvas.dpr * trans.xy,
          y: e.y * this.canvas.dpr * trans.xy
        }
      })
      const imageData = this.canvas.ctx.getImageData(trans.x*dpr, trans.y*dpr, this.canvas.width, this.canvas.height)
      const tmpSaveImagePath = await cardManager.parseCardImageBySelectRectangle({
        imageData,
        points
      })
      this.useImage(tmpSaveImagePath)
    }, undefined, '正在处理图片')
  },

  initCanvas(options?:{noSelect:boolean}){
    const { imageRotate } = this.data.canvasInfo
    this.canvas.clear({
      bg: '#282828'
    })
    const imageY = imageRotate === 90 ? -this.image.height : 0
    this.canvas.drawImage(this.image, 0, imageY, imageRotate)
    if(options?.noSelect) return
    this.data.circles.map((e,i)=>{
      this.canvas.drawCircle(Object.assign({},e,{f:true}))
      this.canvas.drawLine({
        x: this.data.circles[i].x,
        y: this.data.circles[i].y,
        x1: this.data.circles[(i+1)%4].x,
        y1: this.data.circles[(i+1)%4].y,
        width: this.image.width * 0.005
      })
    })
  },

  handleCanvasStart(e){
    const canvasPosition = this.canvas.getCanvasPosition(e)
    const circleRef = this.canvas.ifInCircle(canvasPosition, this.data.circles)
    const { canvasInfo } = this.data
    if(circleRef){
      wx.vibrateShort({
        type: 'light',
      })
      canvasInfo.dragTarget = circleRef
      canvasInfo.status = StatusConfig.DragStart
      canvasInfo.lastEvtPos = canvasPosition
      this.setData({
        canvasInfo
      })
      if(app.isMp){
        this.canvas.drawCircleImage(canvasPosition)
      }
    }
  },

  handleCanvasMove(e){
    let canvasPosition = this.canvas.getCanvasPosition(e)
    const { canvasInfo } = this.data;
    if( canvasInfo.status === StatusConfig.DragStart && 
      this.canvas.getDistance(canvasPosition, canvasInfo.lastEvtPos) > 5*this.canvas.dpr){
        canvasInfo.status = StatusConfig.Dragging
    }else if( canvasInfo.status === StatusConfig.Dragging){
      if(!this.canvas.ifInRectangle(canvasPosition, this.originRect)){
        canvasPosition = this.canvas.closestPointOnRectangle(this.originRect, canvasPosition)
      }
      canvasInfo.dragTarget.x = canvasPosition.x
      canvasInfo.dragTarget.y = canvasPosition.y
      // 重新绘制
      this.initCanvas()
      if(app.isMp){
        this.canvas.drawCircleImage(canvasPosition)
      }
    }

    this.setData({
      canvasInfo,
    })
  },

  handleCanvasEnd(){
    if( this.data.canvasInfo.status === StatusConfig.Dragging ){
      this.setData({
        'canvasInfo.status': StatusConfig.Idle
      })
      this.initCanvas()
    }
  },

  tapToShowMoreOptions(){
    this.setData({
      showMoreOptions: true
    })
  },

  tapToSelectOption(e){
    this.setData({
      showMoreOptions: false
    })
    const option = e.currentTarget.dataset.key
    switch (option) {
      case 'useOrigin':
        {
          // page-container 存在时返回会报错，延时300ms等page-container消失
          sleep(300).then(()=>this.useImage(this.data.tmpImagePath))
        }
        break;
      case 'reset':
        {
          this.setData({
            'circles': JSON.parse(JSON.stringify(this.originRect))
          })
          this.initCanvas()
        }
        break
      default:
        break;
    }
  },

  async getImage(url):Promise<{height:number,width:number}>{
    return new Promise(function (resolve, reject) {
      const offscreenCanvas = wx.createOffscreenCanvas({type: '2d'})
      const image = offscreenCanvas.createImage()
      image.onload = ()=>{
        resolve(image)
      }
      image.onerror = reject
      image.src = url
    })
  }
})