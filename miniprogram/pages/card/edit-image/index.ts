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

  data: {
    navHeight: globalData.CustomBar,
    tmpImagePath: '',
    canvasInfo: {
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
    wx.createSelectorQuery()
      .select('#myCanvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        const { node:canvas, width:realWidth, height:realHeight } = res[0]
        this.canvas = new Canvas({
          canvas,
          renderSize: {
            width: realWidth,
            height: realHeight
          }
        })

        await this.canvas.initCardMode({
          image: this.data.tmpImagePath
        })

        this.canvas.refreshCardMode()
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
      this.canvas.refreshCardMode({noSelect:true})
      const points = this.canvas.scaleImageRectPoints.map(e=>{
        return {
          x: e.x * this.canvas.dpr * this.canvas.trans.xy,
          y: e.y * this.canvas.dpr * this.canvas.trans.xy
        }
      })
      const imageData = this.canvas.ctx.getImageData(this.canvas.trans.x*this.canvas.dpr, this.canvas.trans.y*this.canvas.dpr, this.canvas.width, this.canvas.height)
      const tmpSaveImagePath = await cardManager.parseCardImageBySelectRectangle({
        imageData,
        points
      })
      this.useImage(tmpSaveImagePath)
    }, undefined, '正在处理图片')
  },

  handleCanvasStart(e){
    const canvasPosition = this.canvas.getCanvasPosition(e)
    const circleRef = this.canvas.ifInCircle(canvasPosition, this.canvas.scaleImageRectPoints)
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
      this.canvas.drawCircleImage(canvasPosition)
    }
  },

  handleCanvasMove(e){
    let canvasPosition = this.canvas.getCanvasPosition(e)
    const { canvasInfo } = this.data;
    if( canvasInfo.status === StatusConfig.DragStart && 
      this.canvas.getDistance(canvasPosition, canvasInfo.lastEvtPos) > 5*this.canvas.dpr){
        canvasInfo.status = StatusConfig.Dragging
    }else if( canvasInfo.status === StatusConfig.Dragging){
      if(!this.canvas.ifInRectangle(canvasPosition, this.canvas.originScaleImageRectPoints)){
        canvasPosition = this.canvas.closestPointOnRectangle(this.canvas.originScaleImageRectPoints, canvasPosition)
      }
      canvasInfo.dragTarget.x = canvasPosition.x
      canvasInfo.dragTarget.y = canvasPosition.y
      // 重新绘制
      this.canvas.refreshCardMode()
      this.canvas.drawCircleImage(canvasPosition)
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
      this.canvas.refreshCardMode()
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
          this.canvas.scaleImageRectPoints = JSON.parse(JSON.stringify(this.canvas.originScaleImageRectPoints))
          this.canvas.refreshCardMode()
        }
        break
      default:
        break;
    }
  }
})