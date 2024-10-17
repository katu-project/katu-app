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

  t(str:string, options?:{args?:string[], section?:string|string[]}){
    let useSectionLangs = this.languages.base
    if(options?.section){
      if(typeof options?.section === 'string'){
        useSectionLangs = this.languages[options.section] || {}
      }else{
        useSectionLangs = options?.section.reduce((obj, section) => {
          return { ...obj, ...this.languages[section] };
      }, {})
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
}

export function getI18nInstance(){
  return I18n.getInstance<I18n>()
}