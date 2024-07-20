type Rectangle = {
  width: number
  height: number
}

type CanvasOptions = {
  canvas: WechatMiniprogram.Canvas,
  renderSize: Rectangle,
  canvasSize: Rectangle,
  trans: {
    x:number,
    y:number,
    xy:number
  }
  dpr: number
}

type Point = {
  x: number
  y: number
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

  get canvas(){
    return this.options.canvas
  }

  get width(){
    return this.canvas.width
  }

  get height(){
    return this.canvas.height
  }

  get dpr(){
    return this.options.dpr
  }

  constructor(options:CanvasOptions){
    this.options = options
    const { canvas, canvasSize, dpr, trans, renderSize } = options
    this.ctx = canvas.getContext('2d')
  
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    this.ctx.scale(dpr,dpr)
    // this.ctx.translate(options.trans.x,options.trans.y)
    this.ctx.transform(trans.xy,0,0,trans.xy,trans.x,trans.y)
    this.scale = parseFloat((canvas.width / (renderSize.width * dpr)).toFixed(4))
    trans.xy = parseFloat(trans.xy.toFixed(4))
    console.table({
      'real size': renderSize,
      'canvas size': canvasSize,
      'trans': trans,
      'canvas draw size': {
        width: canvas.width,
        height: canvas.height
      },
      dpr: dpr,
      scale: this.scale
    })
  }

  clear(options:{bg:string}){
    const { xy } = this.options.trans
    this.ctx.fillStyle = options.bg
    this.ctx.clearRect(-this.options.trans.x/xy,-this.options.trans.y/xy,this.options.canvasSize.width/xy,this.options.canvasSize.height/xy)
  }

  // 获取点击点的位置
  getCanvasPosition(e){
    return{
      x: (e.changedTouches[0].x * this.scale - this.options.trans.x) / this.options.trans.xy,
      y: (e.changedTouches[0].y * this.scale - this.options.trans.y) / this.options.trans.xy
    }
  }

  ifInCircle(pos, circles:Point[]){
    for( let i = 0 ; i < circles.length; i++ ){
      // 判断点击点到圆心是不是小于半径
      if( this.getDistance(circles[i], pos) < circles[i].r!* 3 ){
        return circles[i]
      }
    }
    return false
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
    const {trans} = this.options
    if(!r) r = this.canvas.width / this.dpr / 5
    const imageWidth = 2*r

    const sx = (x*trans.xy+trans.x)*this.dpr - imageWidth/(2/scale)
    const sy = (y*trans.xy+trans.y)*this.dpr - imageWidth/(2/scale)
    const dx = (this.canvas.width/this.dpr - trans.x*2)/ trans.xy / 2 - imageWidth/2
    const dy = (0 - trans.y)/ trans.xy 
    
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

    this.ctx.drawImage(
      this.canvas,
      sx, 
      sy, 
      imageWidth*scale,
      imageWidth*scale, 
      dx, 
      dy, 
      imageWidth, 
      imageWidth
    )
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
}