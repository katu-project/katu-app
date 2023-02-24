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

console.log = (...args)=>{
  if(forceDebug){
    console._log(...args)
  }else 
  if(isDev) console._log(`[${time()}][%cinfo%c] `,'color:forestgreen','',...args)
}

console.warn = (...args)=>{
  if(forceDebug){
    console._warn(...args)
  }else 
  if(isDev) console._log(`[${time()}][%cwarn%c] `,'color:burlywood','',...args)
}

console.debug = (...args)=>{
  if(forceDebug){
    console._debug(...args)
  }else 
  if(isDev) console._log(`[${time()}][%cdebug%c]`,'color:cornflowerblue','',...args)
}

console.error = (...args)=>{
  if(forceDebug){
    console._error(...args)
  }else 
  if(isDev) console._log(`[${time()}][%cerror%c]`,'color:orangered','',...args)
}