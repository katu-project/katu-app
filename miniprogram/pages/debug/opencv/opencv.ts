const globalData = getApp().globalData
import { cv,file,upng } from '@/utils/index'
const defaultImage = '/static/images/image.svg'

export {}

Page({
	data: {
    originImage: defaultImage,
		targetImage: defaultImage
	},
	onReady() {
    
  },
  onShow(){
  },
  chooseImage(){
    wx.chooseImage({
      count: 1,
      success: (res)=>{
        console.log(res);
        this.setData({
          originImage: res.tempFilePaths[0]
        })
      }
    })
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
  async showImage(mat){
    this.setData({
      targetImage: defaultImage
    })
    const imageBuffer = upng.encode([mat.data],mat.cols,mat.rows,0)
    const path = await file.getTempFilePath({dir:'temp', cacheId: '111'})
    await file.writeFile(path, imageBuffer)
    const info = await wx.getImageInfo({
      src: path,
    })
    console.log({info})
    this.setData({
      targetImage: path
    })
  },
  async showImage1(imageData){
    this.setData({
      targetImage: defaultImage
    })
    console.log(imageData.data.length);
    const imageBuffer = upng.encode([imageData.data],imageData.width,imageData.height,0)
    const path = await file.getTempFilePath({dir:'temp', cacheId: '1111'})
    await file.writeFile(path, imageBuffer)
    const info = await wx.getImageInfo({
      src: path,
    })
    console.log({info,imageBuffer})
    this.setData({
      targetImage: path
    })
  },
  previewImage(){
    wx.previewImage({
      urls: [this.data.targetImage]
    })
  },
  async btnRun0() {
    const imageData = await this.getImageData(this.data.originImage)
    console.log('origin data:',imageData);
    let src = cv.imread(imageData);
    console.log('type1:',src.type());

    let dst = src.clone()
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(src, dst, new cv.Size(19, 19), 0, 0, cv.BORDER_DEFAULT)
    console.log('type:',dst.type());
    dst = cv.export(dst)
    await this.showImage(dst)
		// 回收对象
		src.delete();
		dst.delete()
	},
	async btnRun1() {
    const imageData = await this.getImageData(this.data.originImage)
    let src = cv.imread(imageData);
    let dst = new cv.Mat();
    dst = src.clone()
		// 灰度化
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    dst = cv.export(dst)
    await this.showImage(dst)
		// 回收对象
		src.delete();
		dst.delete()
	},
	async btnRun2() {
		const imageData = await this.getImageData(this.data.originImage)
    let src = cv.imread(imageData);
    let dst = new cv.Mat();
    dst = src.clone()
    // 灰度化
		cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
		// 边缘检测
    cv.Canny(src, dst, 50, 100, 3, false);
    dst = cv.export(dst)
    await this.showImage(dst)
		// 回收对象
		src.delete();
		dst.delete()
	},
	async btnRun3() {
		const imageData = await this.getImageData(this.data.originImage)
    let src = cv.imread(imageData);
    let dst = new cv.Mat();
    dst = src.clone()
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
    dst = cv.export(dst)
    await this.showImage(dst)
		// 回收对象
		src.delete();
		dst.delete()
  },
  async btnRun4() {
    const imageData = await this.getImageData(this.data.originImage)
    let src = cv.imread(imageData);
    let dst = await this.detectCardByContour(src)
    this.setData({
      targetImage: dst
    })
    
		src.delete()
  },
  async detectCardByContour(src){
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

    rect = cv.export(rect)

    const imageBuffer = upng.encode([rect.data],rect.cols,rect.rows,0)
    const path = await file.getTempFilePath({dir:'temp', cacheId: '1234'})
    await file.writeFile(path, imageBuffer)
    return path
  }
})