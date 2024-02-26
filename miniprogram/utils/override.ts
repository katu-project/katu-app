// 支持单独引入lodash/debounce方法
Object.assign(global, {
  Date: Date,
  Object: Object,
  Function: Function
})

const time = () => {
  const time = new Date()
  return `${time.toLocaleTimeString().slice(0,8)}${time.getMilliseconds().toString().padStart(3,'0')}`
}

const AppInfo = wx.getAccountInfoSync()
const isDev = AppInfo.miniProgram.envVersion === 'develop'
const forceDebug = wx.getStorageSync('KATU_DEBUG')
const fs = wx.getFileSystemManager()

// 单独使用 fs.open 在首次安装并启动app时会报错
const logFile = `${wx.env.USER_DATA_PATH}/err.log`
fs.access({
  path: logFile,
  fail: () => {
    fs.open({
      filePath: logFile,
      flag: 'as',
      fail: console.log,
      success: ()=>{
        console.log('创建日志文件 ok')
      }
    })
  }
})

console._log = console.log
console._warn = console.warn
console._debug = console.debug
console._error = console.error
console._table = console.table || console._log

const levelColors = {
  info: 'forestgreen',
  warn: 'burlywood',
  debug: 'cornflowerblue',
  error: 'orangered'
}

const advLog = (level, ...args) => {
  let logText:String[] = []
  try {
    throw Error('')
  } catch (error:any) {
    const callStack:string[] = error.stack.split('\n').slice(1)
    for (const idx in callStack) {
      if(!callStack[idx].includes('advLog') && callStack[idx].includes('override.js')){
        const callInfo = /.*\/(.*?)\){0,1}$/.exec(callStack[+idx+1])
        const callInfoText = callInfo ? callInfo[1] : ''
        if(callInfoText) {
          logText = [`[${time()}][${callInfoText}][%c${level}%c] `,`color:${levelColors[level]}`,'',...args]
        }
        break
      }
    }
  }
  if(!logText.length){
    logText = [`[${time()}][---][%c${level}%c] `,`color:${levelColors[level]}`,'',...args]
  }
  console._log(...logText)
}

console.log = (...args)=>{
  if(forceDebug){
    console._log(...args)
  }else 
  if(isDev) advLog('info',...args)
}

console.warn = (...args)=>{
  if(forceDebug){
    console._warn(...args)
  }else 
  if(isDev) advLog('warn',...args)
}

console.debug = (...args)=>{
  if(forceDebug){
    console._debug(...args)
  }else 
  if(isDev) advLog('debug',...args)
}

console.error = (...args)=>{
  const log = JSON.stringify({
    time: new Date(),
    data: args
  }, null, 4)

  fs.appendFile({
    filePath: `${wx.env.USER_DATA_PATH}/err.log`,
    data: log+'\n'
  })

  if(forceDebug){
    console._error(...args)
  }else 
  if(isDev) advLog('error',...args)
}

console.table = (...args)=>{
  if(forceDebug){
    console._table(...args)
  }else 
  if(isDev) console._table(...args)
}