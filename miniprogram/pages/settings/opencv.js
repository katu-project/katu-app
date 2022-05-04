// 画布
const canvas1 = 'canvas1'
// 示例图片
const sampleImage1 = '../../static/images/test.png'

let cv = require('../../utils/opencv/index');

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
	imgProcess1(imageData, canvasDom) {
		// 读取图像
		let src = cv.imread(imageData);
		let dst = new cv.Mat();
		// 灰度化
		cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
		// 显示图像
		cv.imshow(canvasDom, dst);
		// 回收对象
		src.delete();
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

    let src = cv.imread(image1Data);
		let dst = new cv.Mat();
		// 灰度化
    // cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(src, dst, new cv.Size(19, 19), 0, 0, cv.BORDER_DEFAULT)
		// 显示图像
    cv.imshow(this.canvasDom, dst);
    this.preview()
		// 回收对象
		src.delete();
		dst.delete()
	},
	async btnRun1() {
    console.log(cv);
    var _that = this;
		// 将图像转换为ImageData
		const image1Data = await _that.createImageElement(sampleImage1)
		// 设置画布的显示大小
		_that.setData({
			canvas1Width: image1Data.width,
			canvas1Height: image1Data.height,
		})
		_that.imgProcess1(image1Data, _that.canvasDom)
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
})