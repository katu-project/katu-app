import { selfish, file, objectSetValue, lodash, getCurrentTimestamp } from "@/utils/index"
import mitt from 'mitt'
const emitter = mitt()

export default class Base {
  private emitter = emitter
  static instance: Base
  static getInstance<T extends Base>(){
    if(!this.instance){
      // Use 'selfish' to solve the problem of passing class methods causing 'this' to be lost
      this.instance = selfish(new this())
      console.debug('Create Class', this.name)
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
    const recordData = record ?? 'None'
    console.debug(`Event: ${key} emit，with data: ${recordData}`)
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
    return lodash.clonedeep(args)
  }
}