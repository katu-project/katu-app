const time = () => {
  const time = new Date()
  return `${time.toLocaleTimeString().slice(0,8)}${time.getMilliseconds().toString().padStart(3,'0')}`
}

const AppInfo = wx.getAccountInfoSync()
const isDev = AppInfo.miniProgram.envVersion === 'develop'
const forceDebug = wx.getStorageSync('KATU_DEBUG')

console._log = console.log
console._warn = console.warn
console._debug = console.debug
console._error = console.error

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
  } catch (error) {
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
  if(forceDebug){
    console._error(...args)
  }else 
  if(isDev) advLog('error',...args)
}