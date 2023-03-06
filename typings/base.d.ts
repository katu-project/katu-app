interface String {
  replaceAll(pattern: any, replacement: string) : string;
}

declare namespace WechatMiniprogram {
  interface Console {
    time: (title:string)=>unknown
    timeEnd: (title:string)=>unknown

    trace: () => any
    _log: (...args) => void
    _warn: (...args) => void
    _debug: (...args) => void
    _error: (...args) => void
  }
}

declare namespace require {
  function async(path:string) : any
}

interface IAnyObject {
  [key:string]: any
}