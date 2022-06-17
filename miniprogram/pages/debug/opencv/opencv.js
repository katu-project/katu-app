// 画布
const canvas1 = 'canvas1'
// 示例图片
const sampleImage1 = '/static/images/test.jpeg'
const { getTempFilePath } = require('../../../utils/file')
let cv = require('../../../utils/opencv/index');
const file = require('../../../utils/file')

Page({
	// 画布的dom对象
  canvasDom: null,
  canvasInstance: null,
	data: {
		canvas1Width: 375,
		canvas1Height: 150,
		// 示例图片
		sampleImage1Url: sampleImage1,
	},
	onReady() {
    
  },
  onShow(){
    this.initCanvas(canvas1)
  },
	// 获取画布
	initCanvas(canvasId) {
		var _that = this;
		wx.createSelectorQuery()
			.select('#' + canvasId)
			.fields({ node: true, size: true })
			.exec((res) => {
				const canvas2d = res[0].node;
				// 设置画布的宽度和高度
				canvas2d.width = res[0].width;
				canvas2d.height = res[0].height;
        _that.canvasDom = canvas2d
			});
	},
	// 创建图像对象
	async createImageElement(imgUrl) {
		// 创建2d类型的离屏画布（需要微信基础库2.16.1以上）
		this.offscreenCanvas = wx.createOffscreenCanvas({type: '2d'});
		const image = this.offscreenCanvas.createImage();
		await new Promise(function (resolve, reject) {
			image.onload = resolve
			image.onerror = reject
			image.src = imgUrl
		})
		this.offscreenCanvas.width = image.width;
		this.offscreenCanvas.height = image.height;
		// draw image on canvas
    var ctx = this.offscreenCanvas.getContext('2d')
		ctx.drawImage(image, 0, 0, image.width, image.height);
		// get image data from canvas
		var imgData = ctx.getImageData(0, 0, image.width, image.height);
 
		return imgData
  },
  async getImageData(url){
    const offscreenCanvas = wx.createOffscreenCanvas({type: '2d'})
		const image = offscreenCanvas.createImage()
		await new Promise(function (resolve, reject) {
			image.onload = resolve
			image.onerror = reject
			image.src = url
		})
		offscreenCanvas.width = image.width;
		offscreenCanvas.height = image.height;
    const ctx = offscreenCanvas.getContext('2d')
		ctx.drawImage(image, 0, 0, image.width, image.height)
		return ctx.getImageData(0, 0, image.width, image.height)
  },
  async saveImageData(mat){
    const offscreenCanvas = wx.createOffscreenCanvas({type: '2d'})
    const ctx = offscreenCanvas.getContext("2d")
    const imageData = ctx.createImageData(mat.cols, mat.rows);
    imageData.data.set(new Uint8ClampedArray(mat.data))
    offscreenCanvas.width = imageData.cols
    offscreenCanvas.height = imageData.rows
    ctx.putImageData(imageData, 0, 0)
    console.log(offscreenCanvas);
    const tempFilePath = offscreenCanvas.toDataURL()
    // const {tempFilePath} = await wx.canvasToTempFilePath({
    //   canvas: offscreenCanvas,
    // })
    return tempFilePath
  },
  preview(){
    wx.canvasToTempFilePath({
      canvas: this.canvasDom,
      success: res => {
        wx.previewImage({
          urls: [res.tempFilePath]
        })
      },
      fail: error => {
        console.log(error);
      }
    })
  },
	async imgProcess1(imageData) {
		// 读取图像
		// let src = cv.imread(imageData);
		// let dst = new cv.Mat();
		// // 灰度化
		// cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
		// // 显示图像
		// cv.imshow(canvasDom, dst);
		// // 回收对象
		// src.delete();
    // dst.delete()
    const of = await file.readFile(sampleImage1)
    // console.log({of, imageData});
    let src = cv.imread(imageData);
    let dst = new cv.Mat();
		// // 灰度化
		dst = this.detectCardByContour(src)
		// // 显示图像
    const img = cv.export(dst)
    console.log({img});
    // const path = await file.getTempFilePath('1234')
    const path = await this.saveImageData(img)
    // console.log({path});
    // const res = await file.writeFile(path, img)
    // console.log({res});
    const info = await wx.getImageInfo({
      src: path,
    })
    console.log({info});
		// // 回收对象
		// src.delete();
    dst.delete()
    
	},
	imgProcess2(imageData, canvasDom) {
		let src = cv.imread(imageData);
		let dst = new cv.Mat();

		// 灰度化
		cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
		// 边缘检测
		cv.Canny(src, dst, 50, 100, 3, false);

		cv.imshow(canvasDom, dst);
		src.delete();
		dst.delete()
	},
	imgProcess3(imageData, canvasDom) {
		let src = cv.imread(imageData);
		let dst = new cv.Mat();

		// 灰度化
		cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

		var orb = new cv.ORB();
		var keypoints = new cv.KeyPointVector();
		var descriptors = new cv.Mat();
		// 特征点
		orb.detect(src, keypoints)
		// 特征点的描述因子
		orb.compute(src, keypoints, descriptors)
		// 绘制特征点
		cv.drawKeypoints(src, keypoints, dst)

		cv.imshow(canvasDom, dst);
		src.delete();
		dst.delete()
  },
  async btnRun0() {
		// 将图像转换为ImageData
		const image1Data = await this.createImageElement(sampleImage1)
    console.log({image1Data});
    let src = cv.imread(image1Data);
    let dst = new cv.Mat();
    dst = src.clone()
		// 灰度化
    // cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    // cv.GaussianBlur(src, dst, new cv.Size(19, 19), 0, 0, cv.BORDER_DEFAULT)
		// 显示图像
    // cv.imshow(this.canvasDom, dst);
    // cv.imshow(this.offscreenCanvas, dst)
    
    const tempFile = await getTempFilePath('111')
    console.log(tempFile,'f');
    const data = wx.arrayBufferToBase64(cv.im2buffer(this.offscreenCanvas,dst))
    console.log(data,'data');
    wx.getFileSystemManager().writeFile({
      filePath: tempFile,
      data: data,
      encoding: 'base64',
      success:res => {
        console.log(res,1);
        wx.previewImage({
          urls: [tempFile]
        })
      },
      fail: err =>{
        console.log(err,2);
      },
      complete: res => {
        console.log(res,3);
      }
    })
    // console.log(this.offscreenCanvas);
    // this.preview()
		// 回收对象
		src.delete();
		dst.delete()
	},
	async btnRun1() {
    var _that = this;
    // 将图像转换为ImageData
    const info = await wx.getImageInfo({src: sampleImage1})
    const imageData = await this.getImageData(sampleImage1)
    const height = info.height / info.width * this.data.canvas1Width
		// 设置画布的显示大小
		_that.setData({
			canvas1Height: height
		})
		_that.imgProcess1(imageData)
	},
	async btnRun2() {
		// 同上
		var _that = this;
		const image1Data = await _that.createImageElement(sampleImage1)
		_that.setData({
			canvas1Width: image1Data.width,
			canvas1Height: image1Data.height,
		})
		_that.imgProcess2(image1Data, _that.canvasDom)
	},
	async btnRun3() {
		// 同上
		var _that = this;
		const image1Data = await _that.createImageElement(sampleImage1)
		_that.setData({
			canvas1Width: image1Data.width,
			canvas1Height: image1Data.height,
		})
		_that.imgProcess3(image1Data, _that.canvasDom)
  },
  detectCardByContour(src){
    function getSize(contour){
        let corner1 = new cv.Point(contour.data32S[0], contour.data32S[1]);
        let corner2 = new cv.Point(contour.data32S[2], contour.data32S[3]);
        let corner3 = new cv.Point(contour.data32S[4], contour.data32S[5]);
        let corner4 = new cv.Point(contour.data32S[6], contour.data32S[7]);

        //Order the corners
        let cornerArray = [{ corner: corner1 }, { corner: corner2 }, { corner: corner3 }, { corner: corner4 }];
        //Sort by Y position (to get top-down)
        cornerArray.sort((item1, item2) => { return (item1.corner.y < item2.corner.y) ? -1 : (item1.corner.y > item2.corner.y) ? 1 : 0; }).slice(0, 5);

        //Determine left/right based on x position of top and bottom 2
        let tl = cornerArray[0].corner.x < cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
        let tr = cornerArray[0].corner.x > cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
        let bl = cornerArray[2].corner.x < cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];
        let br = cornerArray[2].corner.x > cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];

        //Calculate the max width/height
        let widthBottom = Math.hypot(br.corner.x - bl.corner.x, br.corner.y - bl.corner.y);
        let widthTop = Math.hypot(tr.corner.x - tl.corner.x, tr.corner.y - tl.corner.y);
        let theWidth = (widthBottom > widthTop) ? widthBottom : widthTop;
        let heightRight = Math.hypot(tr.corner.x - br.corner.x, tr.corner.y - br.corner.y);
        let heightLeft = Math.hypot(tl.corner.x - bl.corner.x, tr.corner.y - bl.corner.y);
        let theHeight = (heightRight > heightLeft) ? heightRight : heightLeft;
        return [ theWidth,
                theHeight,
                [tl.corner.x, tl.corner.y,
                  tr.corner.x, tr.corner.y,
                  br.corner.x, br.corner.y,
                  bl.corner.x, bl.corner.y]
                ]
    }
    function four_point_transform(src, contour){
        let [theWidth, theHeight, selectedCoords] = getSize(contour)

        if(theWidth<theHeight){
            [theWidth, theHeight] = [theHeight, theWidth]
            selectedCoords = [...selectedCoords.slice(2), ...selectedCoords.slice(0,2)]
        }

        //Transform!
        let finalDestCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, theWidth - 1, 0, theWidth - 1, theHeight - 1, 0, theHeight - 1]);
        let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, selectedCoords);
        let dsize = new cv.Size(theWidth, theHeight);
        let M = cv.getPerspectiveTransform(srcCoords, finalDestCoords)

        let dst = new cv.Mat()
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        M.delete();finalDestCoords.delete();srcCoords.delete()
        return dst
    }
    let originSrc = src.clone()
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

    let ksize = new cv.Size(5, 5)
    cv.GaussianBlur(src, src, ksize, 0, 0, cv.BORDER_DEFAULT)
    cv.threshold(src, src, 150, 255, cv.THRESH_BINARY);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    let sortedCnts = []
    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i)
        let area = cv.arcLength(cnt, true)
        sortedCnts.push({i,area})
        cnt.delete()
    }

    let areaSortedCnts = sortedCnts
                    .sort((a,b)=>a.area-b.area)
                    .slice(-5)
                    .map(e=>contours.get(e.i))
                    .reverse()
    // console.log("检测到轮廓：",areaSortedCnts);
    let poly = new cv.MatVector();
    let idx = 0
    for (const i in areaSortedCnts) {
      let tmp = new cv.Mat();
      let peri = cv.arcLength(areaSortedCnts[i] , true)
      cv.approxPolyDP(areaSortedCnts[i] , tmp, 0.02*peri, true);
      // console.log("轮廓信息：",tmp.rows,tmp);
      if(tmp.rows == 4){
          poly.push_back(tmp)
          const area = cv.contourArea(areaSortedCnts[i])
          const zb = parseFloat((area/(originSrc.rows*originSrc.cols)).toFixed(2))
          console.log(`发现第${+i+1}个4点轮廓: ${area}, 内容占比: ${zb}`);
          if(zb < 0.95 && zb > 0.40){
              idx = poly.size()-1
          }
      }else{
          tmp.delete();
      }
    }

    console.log('poly:',poly,poly.size(),idx);
    if(!poly.size()) {
        throw Error("no rect found")
    }

    let rect = four_point_transform(originSrc, poly.get(idx))
    poly.delete();contours.delete(),hierarchy.delete()
    return rect
  }
})