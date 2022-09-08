const { QRCode, QRErrorCorrectLevel } = require('./qrcode')

// support Chinese
function utf16to8 (str) {
  var out, i, len, c
  out = ''
  len = str.length
  for (i = 0; i < len; i++) {
    c = str.charCodeAt(i)
    if ((c >= 0x0001) && (c <= 0x007F)) {
      out += str.charAt(i)
    } else if (c > 0x07FF) {
      out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F))
      out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F))
      out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F))
    } else {
      out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F))
      out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F))
    }
  }
  return out
}

export function drawQrcode (options) {
  options = options || {}
  options = Object.assign({}, {
    width: 256,
    height: 256,
    x: 0,
    y: 0,
    typeNumber: -1,
    correctLevel: QRErrorCorrectLevel.H,
    background: '#ffffff',
    foreground: '#000000',
    image: {
      imageResource: '',
      dx: 0,
      dy: 0,
      dWidth: 100,
      dHeight: 100
    }
  }, options)

  if (!options.ctx) {
    throw Error('please set canvasId or ctx!')
  }

  createCanvas()

  function createCanvas () {
    // create the qrcode itself
    var qrcode = new QRCode(options.typeNumber, options.correctLevel)
    qrcode.addData(utf16to8(options.text))
    qrcode.make()

    // get canvas context
    var ctx = options.ctx

    const len = qrcode.getModuleCount()
    // compute tileW/tileH based on options.width/options.height
    var tileW = options.width / len
    var tileH = options.height / len

    // draw in the canvas
    for (var row = 0; row < len; row++) {
      for (var col = 0; col < len; col++) {
        if(options.drawDot){
          const [x,y,w,h,c] = options.drawDot(row,col,len,qrcode.modules[row][col])
          ctx.fillStyle = c
          ctx.fillRect(x,y,w,h)
        }else{
          ctx.fillStyle = qrcode.isDark(row, col) ? options.foreground : options.background
          var w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW))
          var h = (Math.ceil((row + 1) * tileW) - Math.floor(row * tileW))
          ctx.fillRect(Math.round(col * tileW) + options.x, Math.round(row * tileH) + options.y, w, h)
        }
      }
    }

    if (options.image.imageResource) {
      ctx.drawImage(options.image.imageResource, options.image.dx, options.image.dy, options.image.dWidth, options.image.dHeight)
    }

    options.callback && options.callback(qrcode,options)
  }
}