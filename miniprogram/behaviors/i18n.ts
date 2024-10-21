import { getAppManager } from '@/controller/app'
import { Languages } from '@/i18n/index'

export const CreateI18nBehavior = (options?:{page:string|string[]})=>{
  const app = getAppManager()
  return Behavior({
    data: {
      t:{}
    },

    async attached(){
      const useLang = app.getUseLanguage()
      const langLib = Languages[useLang!]
      let usePageLangs = {}
      if(options?.page){
        if(typeof options?.page === 'string'){
          usePageLangs = langLib[options.page] 
        }else{
          usePageLangs = options?.page.reduce((obj, page) => {
            return { ...obj, ...langLib[page] };
        }, {})
        }
      }
      this.setData({
        t: {
          ...langLib.base,
          ...usePageLangs
        }
      })
    },

    methods: {
      t(str:string, args?:string[]){
        return app.i18n._t(str, {
          args,
          lib: this.data.t
        })
      }
    }
  })
}