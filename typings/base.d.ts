interface String {
  replaceAll(pattern: any, replacement: string) : string;
}

interface functionDefaultOptions {
  success?: (res: any) => void
  fail?: (err: any) => void
  complete?: () => void
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
    miniapp: {
      launchMiniProgram(args: {
        userName: string,
        path?: string,
        miniprogramType?: number
      } & functionDefaultOptions): unknown
      openCustomerServiceChat(args: {corpId:string,url:string} & functionDefaultOptions): unknown
      hasWechatInstall(args?: functionDefaultOptions): unknown
    }
    checkIdentitySession(args?: functionDefaultOptions): unknown
    appleLogin(args?:functionDefaultOptions): unknown
    weixinMiniProgramLogin(args?: functionDefaultOptions): unknown
    logout(args?: functionDefaultOptions): unknown
    openPrivacyContract(args:any): unknown
    getPrivacySetting(args:any): unknown
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