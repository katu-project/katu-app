import { Languages } from "@/i18n/index"
import Base from "@/class/base"

class I18n extends Base {
  private useLanguage = ''
  private languages = {
    base: {}
  }

  constructor(lang?:string){
    super()
    lang && this.changeLanguage(lang)
  }

  changeLanguage(lang:string){
    this.useLanguage = lang
    this.languages = Languages[lang] || {}
    console.debug('Set App Lang:', this.useLanguage)
  }

  _t(str:string, options?:{args?:string[], section?:string|string[], lib?:AnyObject}){
    let useSectionLangs = this.languages.base
    if(options?.lib){
      useSectionLangs = options.lib
    }else{
      if(options?.section){
        if(typeof options?.section === 'string'){
          useSectionLangs = this.languages[options.section] || {}
        }else{
          useSectionLangs = options?.section.reduce((obj, section) => {
            return { ...obj, ...this.languages[section] };
        }, {})
        }
      }
    }

    let result = useSectionLangs[str] || str
    if (options?.args) {
      options.args.map(item=>{
        if(result){
          result = result.replace('{#}', item)
        }
      })
    }
    return result
  }

  t(str:string, args?:string[], section?:string|string[]){
    return this._t(str,{
      args,
      section
    })
  }

  t_e(str:string, args?:string[]){
    return this._t(str,{
      args,
      section: 'error'
    })
  }

  t_k(str:string, args?:string[]){
    return this._t(str,{
      args,
      section: 'key'
    })
  }
}

export function getI18nInstance(){
  return I18n.getInstance<I18n>()
}