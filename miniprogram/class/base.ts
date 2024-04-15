import { selfish, file, objectSetValue, clonedeep, getCurrentTimestamp } from "@/utils/index"
import mitt from 'mitt'
const emitter = mitt()

export default class Base {
  private emitter = emitter
  static instance: Base
  static getInstance<T extends Base>(){
      if(!this.instance){
          this.instance = selfish(new this())
      }
      return this.instance as T
  }

  get on(){
    return this.emitter.on
  }
  
  get off(){
    return this.emitter.off
  }

  emit(key:string, record?:any){
    const recordData = record === null || record === undefined ? '无' : record 
    console.debug(`事件: ${key} 发出，携带数据: ${recordData}`)
    return this.emitter.emit(key, record)
  }

  get currentTimestamp(){
    return getCurrentTimestamp()
  }

  getEeventList(){
    return this.emitter.all
  }

  getFilePath(dir:string, name:string){
    return file.getFilePath({
      dir,
      name
    })
  }

  objectSetValue(obj:IAnyObject, path:string, value:any, separator?:string){
    return objectSetValue(obj,path,value,separator || '_')
  }

  deepCloneObject<T>(args:T):T{
    return clonedeep(args)
  }
}