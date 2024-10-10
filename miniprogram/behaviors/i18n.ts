import { getAppManager } from '@/controller/app'
import { Languages } from '@/i18n/index'

export const CreateI18nBehavior = ({page})=>{
  const app = getAppManager()
  return Behavior({
    data: {
      t:{}
    },

    async attached(){
      const useLang = await app.getUseLanguage()
      const langLib = Languages[useLang!]
      this.setData({
        t: {
          ...langLib.base,
          ...langLib[page]
        }
      })
    },

    methods: {
      t(str:string, args?:string[]){
        let result = this.data.t[str] || str
        if (args) {
          args.map(item=>{
            if(result){
              result = result.replace('{#}', item)
            }
          })
        }
        return result
      }
    }
  })
}