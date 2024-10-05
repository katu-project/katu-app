import { getAppManager } from '@/controller/app'
export const CardChangeEvent = 'CardChange'
export const CardDeleteEvent = 'CardDelete'
export const CardHideEvent = 'CardHide'
export const CardDecryptEvent = 'CardDecrypt'
export const CardEditImageEvent = 'CardEditImage'
export const CardEditTitleEvent = 'CardEditTitle'
export const CardEditExtraDataEvent = 'CardEditExtraData'
export const TagChangeEvent = 'TagChange'
export const AppleOrderPayDoneEvent = 'AppleOrderPayDone'
export const AppleOrderPayCancelEvent = 'AppleOrderPayCancel'
export const LoginChangeEvent = 'LoginChange'
export const CacheDeleteEvent = 'CacheDelete'
export const UserProfileChangeEvent = 'UserProfileChange'
export const TelCodeSelectedEvent = 'TelCodeSelected'
export const MasterKeyCacheEvent = 'MasterKeyCache'
export const MasterKeyRemoveEvent = 'MasterKeyRemove'

export const CreateEventBehavior = (page:string)=>{
  const app = getAppManager()

  const PageEventsMap = {
    list: [
      CardChangeEvent,
      CardDeleteEvent,
      CardHideEvent,
      CardDecryptEvent
    ],
    detail: [
      CardChangeEvent
    ],
    edit: [
      CardEditImageEvent,
      CardEditTitleEvent,
      CardEditExtraDataEvent,
      TagChangeEvent
    ],
    quota: app.isIos ? [
      AppleOrderPayDoneEvent,
      AppleOrderPayCancelEvent
    ] : [],
    home: [
      CardChangeEvent,
      CardDeleteEvent,
      CardDecryptEvent,
      CardHideEvent,
      LoginChangeEvent,
      CacheDeleteEvent
    ],
    profile: [
      UserProfileChangeEvent,
      LoginChangeEvent
    ],
    auth: app.isApp ? [
      TelCodeSelectedEvent
    ] : []
  }

  if(!PageEventsMap[page]) return
  const pageEvents = PageEventsMap[page]
  const funcMap = new Map()

  return Behavior({
    lifetimes: {
      created(){
        console.debug('挂载页面事件:', pageEvents)
        this.loadEvent()
      },
      detached(){
        console.debug('卸载页面事件:', pageEvents)
        this.unloadEvent()
      }
    },
    methods: {
      loadEvent(){
        pageEvents.map(event=>{
          const func = (this[`onEvent${event}`] as Function).bind(this)
          funcMap.set(event, func)
          this.subscribe(event, func)
        })
      },
    
      unloadEvent(){
        pageEvents.map(event=>{
          const func = funcMap.get(event)
          this.unsubscribe(event, func)
        })
      },
  
      subscribe(event, handler){
        if(!handler){
          console.warn(`${event} 事件不存在`)
          return
        }
        app.on(event,handler)
      },
    
      unsubscribe(event, handler){
        if(!handler){
          console.warn(`${event} 事件不存在`)
          return
        }
        app.off(event,handler)
      }
    }
  })
}