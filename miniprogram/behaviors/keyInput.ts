import { getAppManager } from '@/controller/app'

export const CreateKeyInput = ()=>{
  const app = getAppManager()
  return Behavior({

    properties: {
      
    },
  
    data: {
      __inputKey:{
        show: false,
        title: '',
        inputMode: '',
        changeMode: false,
        resultText: ''
      }
    },
  
    methods: {
      showKeyInput(options){
        this.configKeyInput(options)
        this.setData({
          '__inputKey.show': true
        })
      },
  
      hideKeyInput(){
        this.setData({
          '__inputKey.show': false
        })
      },
  
      tapToForgetKey(){
        app.goResetKeyPage()
      },

      configKeyInput(options){
        const setData = {}
        if(options?.hasOwnProperty('inputMode')){
          setData['__inputKey.inputMode'] = options.inputMode
        }
        if(options?.hasOwnProperty('changeMode')){
          setData['__inputKey.changeMode'] = options.changeMode
        }
        if(options?.hasOwnProperty('title')){
          setData['__inputKey.title'] = options.title
        }
        if(options?.hasOwnProperty('resultText')){
          setData['__inputKey.resultText'] = options.resultText
        }
        this.setData(setData)
      },

      keyInputConfirm(e){
        const key = e.detail.value
        app.masterKeyManager.loadWithKey(key).then(async ()=>{
          this.hideKeyInput()
          this.inputKeyConfirm()
        }).catch(error=>{
          console.log(error)
          this.configKeyInput({
            resultText: error.message
          })
        })
      }
    }
  })
}