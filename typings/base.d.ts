interface String {
  replaceAll(pattern: any, replacement: string) : string;
}

declare namespace WechatMiniprogram {
  interface Console {
    time: (title:string)=>unknown
    timeEnd: (title:string)=>unknown
  }
}

interface IAnyObject {
  [key:string]: any
}