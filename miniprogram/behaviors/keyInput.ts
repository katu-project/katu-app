import { getAppManager } from '@/controller/app'

export const CreateKeyInput = (optinos?:KeyInputBehaviorOptionsType&{customKeyInputConfirm?:boolean})=>{
  const app = getAppManager()
  return Behavior({

    properties: {
      
    },
  
    data: {
      customKeyInputConfirm: optinos?.customKeyInputConfirm,
      __inputKey:{
        show: false,
        title: optinos?.title || '输入密码：',
        inputMode: optinos?.inputMode || '',
        changeMode: optinos?.hasOwnProperty('changeMode') ? optinos.changeMode : true,
        resultText: optinos?.resultText || '',
        showSubBtn: optinos?.hasOwnProperty('showSubBtn') ? optinos.showSubBtn : true,
        subBtnText: optinos?.subBtnText || '忘记密码'
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
        if(options?.hasOwnProperty('showSubBtn')){
          setData['__inputKey.showSubBtn'] = options.showSubBtn
        }
        if(options?.hasOwnProperty('subBtnText')){
          setData['__inputKey.subBtnText'] = options.subBtnText
        }
        this.setData(setData)
      },

      keyInputConfirm(e){
        if(this.data.customKeyInputConfirm) return this.inputKeyConfirm(e)
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