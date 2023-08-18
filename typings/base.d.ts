interface String {
  replaceAll(pattern: any, replacement: string) : string;
}

declare namespace WechatMiniprogram {
  interface Console {
    time: (title:string)=>unknown
    timeEnd: (title:string)=>unknown
    table: (data:any)=>unknown
    
    trace: () => any
    _log: (...args) => void
    _warn: (...args) => void
    _debug: (...args) => void
    _error: (...args) => void
    _table: (data:any) => void
  }
  
  interface Wx {
    openPrivacyContract(args:any): unknown
  }
}

declare namespace require {
  function async(path:string) : any
}

interface IAnyObject {
  [key:string]: any
}

type TupleToObject<T extends readonly (keyof any)[]> = {
  [P in T[number]]:P
}