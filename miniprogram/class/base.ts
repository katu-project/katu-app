import { getCache, selfish, setCache, delCache } from "@/utils/index"
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

  get emit(){
    return this.emitter.emit
  }

  getEeventList(){
    return this.emitter.all
  }
  // event end

  async getLocalData<T>(key:string){
    try {
      const res: T = await getCache(key)
      return res
    } catch (error) {
      console.warn('getLocalData:', key, error)
    }
    return
  }
  
  async setLocalData(key, data){
    return setCache(key, data)
  }

  async deleteLocalData(key:string){
    try {
      await delCache(key)
    } catch (error) {
      console.error(error)
    }
  }
  
}