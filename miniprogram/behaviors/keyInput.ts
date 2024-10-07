import { getAppManager } from '@/controller/app'

export const CreateKeyInput = ()=>{
  const app = getAppManager()
  return Behavior({

    properties: {
      
    },
  
    data: {
      __inputKey:{
        show: false,
        tips: '',
        inputMode: '',
        changeMode: false,
        resultText: ''
      }
    },
  
    methods: {
      showKeyInput(options){
        const setData = {
          '__inputKey.show': true
        }
        if(options?.hasOwnProperty('inputMode')){
          setData['__inputKey.inputMode'] = options.inputMode
        }
        if(options?.hasOwnProperty('changeMode')){
          setData['__inputKey.changeMode'] = options.changeMode
        }
        if(options?.hasOwnProperty('tips')){
          setData['__inputKey.tips'] = options.tips
        }
        this.setData(setData)
      },
  
      hideKeyInput(){
        this.setData({
          '__inputKey.show': false
        })
      },
  
      tapToForgetKey(){
        app.goResetKeyPage()
      },

      keyInputConfirm(e){
        const key = e.detail.value
        app.masterKeyManager.loadWithKey(key).then(async ()=>{
          this.hideKeyInput()
          this.inputKeyConfirm()
        }).catch(error=>{
          console.log(error)
          this.showKeyInputTips(error.message)
        })
      },

      changeKeyInputMode(mode){
        this.setData({
          '__inputKey.inputMode': mode
        })
      },

      showKeyInputTips(msg:string){
        this.setData({
          '__inputKey.resultText': msg
        })
      },

      setKeyInputTitle(title){
        this.setData({
          '__inputKey.tips': title
        })
      },

      setKeyInputChangeMode(value){
        this.setData({
          '__inputKey.changeMode': value
        })
      }
    }
  })
}