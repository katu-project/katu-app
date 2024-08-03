type Rectangle = {
  width: number
  height: number
}

type CanvasOptions = {
  canvas: WechatMiniprogram.Canvas,
  renderSize: Rectangle
}

type Point = {
  x: number
  y: number
  s?: boolean
  r?: number,
  f?: number
}

const DefaultFillStyle = "#fab91a"
const DefaultStrokeStyle = "#fab91a"
const DefaultLineWidth = 4

export class Canvas {
  ctx = {} as WechatMiniprogram.RenderingContext
  options = {} as CanvasOptions

  scale = 1
  realSize = {} as Rectangle
  size = {} as Rectangle
  dpr = 1

  trans = {
    x: 0,
    y: 0,
    xy: 1
  }

  get canvas(){
    return this.options.canvas
  }

  get width(){
    return this.canvas.width
  }

  get height(){
    return this.canvas.height
  }

  constructor(options:CanvasOptions){
    this.options = options
    const { canvas, renderSize } = options
    this.ctx = canvas.getContext('2d')
    this.dpr = wx.getSystemInfoSync().pixelRatio
    this.realSize = renderSize
  }

  scaleImage = {} as WechatMiniprogram.Image
  scaleImageRotate = 0
  originScaleImageRectPoints = [] as Point[]
  scaleImageRectPoints = [] as Point[]

  async initCardMode({image}){
    this.scaleImage = await this.getImage(image)

    let imageRotate = 0
    let imageWidth = this.scaleImage.width
    let imageHeight = this.scaleImage.height
    const realScale = this.realSize.width / this.realSize.height

    console.debug({imageWidth,imageHeight})
    if(imageWidth>imageHeight){
      [imageWidth,imageHeight] = [imageHeight,imageWidth]
      imageRotate = 90
    }
    const radius = imageWidth * 0.03
    this.originScaleImageRectPoints = [
      {x: 0, y: 0, r: radius},
      {x: imageWidth, y: 0, r: radius},
      {x: imageWidth, y: imageHeight, r: radius},
      {x: 0, y: imageHeight, r: radius}
    ]
 
    this.scaleImageRotate = imageRotate
    this.scaleImageRectPoints = JSON.parse(JSON.stringify(this.originScaleImageRectPoints))

    const imageScale = imageWidth/imageHeight
    console.debug({realScale,imageScale})

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
    if(canvasSize.height * this.dpr > 4000){
      const fixHeight = 4000 / this.dpr
      const fixWidth = fixHeight * realScale
      this.trans.xy = fixHeight/canvasSize.height
      console.debug('canvas 解决4096限制后的尺寸：',fixWidth.toFixed(),fixHeight.toFixed(), ',缩放比例：', this.trans.xy.toFixed(2))
      canvasSize.height = fixHeight
      canvasSize.width = fixWidth
    }

    this.trans.x = Math.floor((canvasSize.width - imageWidth * this.trans.xy) / 2)
    this.trans.y = Math.floor((canvasSize.height - imageHeight * this.trans.xy) / 2)
    canvasSize.height = Math.ceil(canvasSize.height)
    canvasSize.width = Math.ceil(canvasSize.width)

    console.debug('canvas 修正后的最终尺寸：',canvasSize.width,canvasSize.height,this.dpr)

    this.canvas.width = canvasSize.width * this.dpr
    this.canvas.height = canvasSize.height * this.dpr
    this.ctx.scale(this.dpr, this.dpr)

    this.ctx.transform(this.trans.xy, 0, 0, this.trans.xy, this.trans.x, this.trans.y)
    this.scale = parseFloat((this.width / (this.realSize.width * this.dpr)).toFixed(4))
    this.trans.xy = parseFloat(this.trans.xy.toFixed(4))
    this.size = canvasSize
    console.table({
      'real size': this.realSize,
      'canvas size': canvasSize,
      'trans': this.trans,
      'canvas draw size': {
        width: this.width,
        height: this.height
      },
      dpr: this.dpr,
      scale: this.scale
    })
  }

  refreshCardMode(options?:{noSelect:boolean}){
    this.clear({
      bg: '#282828'
    })
    const imageY = this.scaleImageRotate === 90 ? - this.scaleImage.height : 0
    this.drawImage(this.scaleImage, 0, imageY, this.scaleImageRotate)
    if(options?.noSelect) return
    this.scaleImageRectPoints.map((e,i,points)=>{
      this.drawCircle(Object.assign({},e,{f:true}))
      this.drawLine({
        x: points[i].x,
        y: points[i].y,
        x1: points[(i+1)%4].x,
        y1: points[(i+1)%4].y,
        width: this.scaleImage.width * 0.005
      })
    })
  }

  clear(options:{bg:string}){
    const { xy } = this.trans
    this.ctx.fillStyle = options.bg
    this.ctx.clearRect(-this.trans.x/xy,-this.trans.y/xy,this.size.width/xy,this.size.height/xy)
  }

  // 获取点击点的位置
  getCanvasPosition(e){
    return{
      x: (e.changedTouches[0].x * this.scale - this.trans.x) / this.trans.xy,
      y: (e.changedTouches[0].y * this.scale - this.trans.y) / this.trans.xy
    }
  }

  ifInCircle(pos, circles: Point[]){
    let truePoint
    for( let i = 0 ; i < circles.length; i++ ){
      circles[i].s = false
      // 判断点击点到圆心是不是小于半径
      if( this.getDistance(circles[i], pos) < circles[i].r!* 3 ){
        circles[i].s = true 
        truePoint = circles[i] 
      }
    }
    return truePoint || false
  }

  ifInRectangle(pos:Point, rectangle:Point[]){
    const {x:px,y:py} = pos
    const x0 = rectangle[0].x
    const x2 = rectangle[2].x
    const y0 = rectangle[0].y
    const y2 = rectangle[2].y
    return px >= x0 && px <= x2 && py >= y0 && py <= y2;
  }

  // 获取两点之间的距离（数学公式）
  getDistance(p1, p2){
    return Math.sqrt((p1.x-p2.x) ** 2 + (p1.y-p2.y) ** 2)
  }

  drawCircleImage({x,y},r=0,scale=2){
    // r 是 放大镜半径，默认取 画布宽度/6
    if(!r) r = this.canvas.width / 6 / this.dpr / this.trans.xy
    const imageWidth = 2*r

    // 原始图片x
    let sx = 0
    // 原始图片y
    let sy = 0 
    // 画布 x
    let dx = (this.canvas.width/this.dpr - this.trans.x*2)/ this.trans.xy / 2 - imageWidth/2
    // 画布 y
    let dy = (0 - this.trans.y)/ this.trans.xy 
    
    const circleImage = {
      x: dx+r,
      y: dy+r,
      r
    }
   
    this.ctx.save()
    this.ctx.fillStyle = '#fff'
    this.ctx.arc(circleImage.x, circleImage.y, circleImage.r, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.clip()

    this.ctx.save()
    // 注意，这里硬编码了顺时针旋转90度
    if(this.scaleImageRotate === 90){
      this.rotate(this.scaleImageRotate)
      this.ctx.translate(0, -this.scaleImage.height)
      sx = y - imageWidth / (scale*2)
      sy = (this.scaleImage.height - x)-imageWidth / (scale*2)
      {
        [dx,dy] = [dy,dx]
      }
    }else{
      sx = x - imageWidth/(scale*2)
      sy = y - imageWidth/(scale*2)
    }

    this.ctx.drawImage(
      this.scaleImage,
      sx,
      sy,
      imageWidth/scale,
      imageWidth/scale, 
      dx, 
      dy, 
      imageWidth, 
      imageWidth
    )
    this.ctx.restore()

    // 绘制当前点的夹角线
    const selectedPoint = this.scaleImageRectPoints.findIndex(e=>e.s)
    if(selectedPoint!==-1){
      const left = this.scaleImageRectPoints[(4+selectedPoint-1)%4]
      const mid = this.scaleImageRectPoints[selectedPoint]
      const right = this.scaleImageRectPoints[(4+selectedPoint+1)%4]
      const constX = circleImage.x - mid.x
      const constY = circleImage.y - mid.y

      this.drawLine({
        x: circleImage.x,
        y: circleImage.y,
        x1: left.x + constX,
        y1: left.y + constY,
        width: this.width * 0.005
      })
      this.drawLine({
        x: circleImage.x,
        y: circleImage.y,
        x1: right.x + constX,
        y1: right.y + constY,
        width: this.width * 0.005
      })
    }

    this.ctx.restore()
  }

  drawCircle({x, y, r, f}:{x, y, r, f?:boolean}){
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.strokeStyle = DefaultStrokeStyle
    this.ctx.fillStyle = DefaultFillStyle
    this.ctx.lineWidth = DefaultLineWidth
    this.ctx.arc(x, y, r, 0, 2 * Math.PI)
    if(f){
      this.ctx.fill()
    }else{
      this.ctx.stroke()
    }
    this.ctx.closePath()
    this.ctx.restore()
  }

  drawLine({x, y, x1, y1, color, width}:{x, y, x1, y1, color?:string, width?:number}){
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.lineWidth = width || DefaultLineWidth
    this.ctx.strokeStyle = color || DefaultStrokeStyle
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(x1, y1)
    this.ctx.stroke()
    this.ctx.closePath()
    this.ctx.restore()
  }

  rotate(degree){
    this.ctx.rotate((degree * Math.PI) / 180)
  }

  drawImage(image, x, y, degree){
    this.ctx.save()
    this.rotate(degree)
    this.ctx.drawImage(image,x,y)
    this.ctx.restore()
  }

  closestPointOnRectangle(rectangle:Point[], P:Point) {
    const [A, B, C, D] = rectangle
    // 辅助函数：计算点到直线的垂足
    function perpendicularFoot(px, py, ax, ay, bx, by) {
        let dx = bx - ax;
        let dy = by - ay;
        let lengthSquared = dx * dx + dy * dy;
        let t = ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        return {
            x: ax + t * dx,
            y: ay + t * dy
        };
    }

    // 辅助函数：计算两点之间的距离
    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // 矩形的四条边
    const edges = [
        { start: A, end: B },
        { start: B, end: C },
        { start: C, end: D },
        { start: D, end: A }
    ];

    let closestPoint:Point = {x:0,y:0}
    let minDistance = Infinity

    // 遍历每条边
    for (const edge of edges) {
        const foot = perpendicularFoot(P.x, P.y, edge.start.x, edge.start.y, edge.end.x, edge.end.y);
        const edgeDistance = distance(P.x, P.y, foot.x, foot.y);
        
        if (edgeDistance < minDistance) {
            minDistance = edgeDistance;
            closestPoint = foot;
        }
    }
    // console.debug(`最近点的坐标是: (${closestPoint.x}, ${closestPoint.y})`);
    return closestPoint;
  }

  async getImage(url):Promise<WechatMiniprogram.Image>{
    return new Promise((resolve, reject) => {
      const image = this.canvas.createImage()
      image.onload = ()=>{
        resolve(image)
      }
      image.onerror = reject
      image.src = url
    })
  }
}