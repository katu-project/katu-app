import { selfish } from "@/utils/index"
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
}