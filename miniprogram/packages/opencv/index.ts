import { cv } from './opencv'
import { sleep, upng, file } from '@/utils/index'

// 识别卡片返回临时路径
export async function detectCardByContour(url, path){
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
      let [theWidth, theHeight, selectedCoords] = getSize(contour) as [theWidth:number,theHeight:number,selectedCoords:number[]]

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

  await loadOpenCV()
  const imageData = await file.getImageData(url)
  const src = cv.imread(imageData)

  let originSrc = src.clone()
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

  let ksize = new cv.Size(5, 5)
  cv.GaussianBlur(src, src, ksize, 0, 0, cv.BORDER_DEFAULT)
  cv.threshold(src, src, 150, 255, cv.THRESH_BINARY);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

  let sortedCnts: {i:number,area:number}[] = []
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
  let idx = -1
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
  if(idx === -1) {
      throw Error("未检测出卡片")
  }

  let rect = four_point_transform(originSrc, poly.get(idx))
  poly.delete();contours.delete(),hierarchy.delete()

  rect = cv.export(rect)

  const imageBuffer = upng.encode([rect.data],rect.cols,rect.rows,0)
  await file.writeFile(path, imageBuffer)
  return path
}

// todo: 现在cv模块加载是异步的，没办法确认完成时间，后续要优化一下，手动实例化
// return cv 会出错，await 里返回 cv['then']的原因
async function loadOpenCV() {
  console.debug('load opencv')
  let loadCount = 0
  while (!cv.Mat) {
    loadCount++
    if (loadCount > 10) {
      throw Error('load cv failed')
    }
    await sleep(500)
  }
  console.debug('opencv load success')
}