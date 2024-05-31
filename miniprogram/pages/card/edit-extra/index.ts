import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { getCardManager } from '@/controller/card'
import { CardEditExtraDataEvent } from '@/behaviors/event'
const app = getAppManager()
const cardManager = getCardManager()
const user = getUserManager()
const CardExtraDataFieldsKeys = app.getCardConfig('defaultFields')

Page({
  originData: '' as string|undefined,
  data: {
    extraFieldsKeys: CardExtraDataFieldsKeys,
    extraFields: [] as AnyObject[]
  },

  onLoad(options) {
    this.originData = options.value
    const parseExtraData = JSON.parse(options.value||'[]')
    if(parseExtraData.length){
      let extraFieldsKeys = this.data.extraFieldsKeys
      const extraFields = cardManager.rebuildExtraFields(parseExtraData)
      // 移除存在的项目
      extraFieldsKeys = extraFieldsKeys.filter(item=>{
        return item.key === 'cu' || !extraFields.some(e=>item.key === e.key)
      })
      this.setData({
        extraFieldsKeys,
        extraFields
      })
    }else{
      //不存在数据时根据tag(如果有)来显示默认填写的字段
      if(options.tag){
        const checkFieldTag = cardManager.getCardConfig('defaultTags').find(tag=>tag._id === options.tag)
        if(checkFieldTag && checkFieldTag.field){
          this.addField(checkFieldTag.field)
        }
      }
    }
  },

  onBindinput({currentTarget:{dataset: {idx, cu}}, detail: {value}}){
    const key = `extraFields[${idx}].${cu?'name':'value'}`
    this.setData({
      [key]: value
    })
  },

  onBindchange(e){
    const idx = parseInt(e.detail.value)
    if(!this.data.extraFieldsKeys[idx]) return
    this.addField([this.data.extraFieldsKeys[idx].key])
  },

  addField(keys){
    let extraFields = this.data.extraFields
    for (const key of keys) {
      const extraField = Object.assign({},this.data.extraFieldsKeys.find(e=>e.key === key))
      if(extraField.key === 'cu'){
        extraField.name = `字段 ${this.data.extraFields.filter(e=>e.key==='cu').length+1}`
      }
      extraFields = extraFields.concat(extraField).sort((a,b)=> a.xid-b.xid)
    }
    
    this.setData({
      extraFields,
      extraFieldsKeys: this.data.extraFieldsKeys.filter(e => e.key === 'cu' || !keys.includes(e.key))
    })
  },

  onBindDateChange({currentTarget:{dataset: {idx}}, detail: {value}}){
    const key = `extraFields[${idx}].value`
    this.setData({
      [key]: value
    })
  },

  tapToRemoveField(e){
    const idx = parseInt(e.currentTarget.dataset.idx)
    const selectedField = this.data.extraFields[idx]

    this.data.extraFields.splice(idx,1)
    const setData = {
      extraFields: this.data.extraFields
    }
    if(selectedField.key !== 'cu'){
      setData[`extraFieldsKeys`] = this.data.extraFieldsKeys.concat(CardExtraDataFieldsKeys.find(e=>e.key === selectedField.key)!).sort((a,b)=> a.xid-b.xid)
    }

    this.setData(setData)
  },

  async tapToSave(){
    if(this.data.extraFields.length){
      if(this.data.extraFields.some(field=>!field.value || !field.name)){
        app.showNotice('内容填写有误')
        return
      }
      const extraFields = cardManager.condenseExtraFields(this.data.extraFields as ICardExtraField[])

      if(this.originData === JSON.stringify(extraFields)) {
        app.showNotice('内容无变动')
        return
      }
      
      // 未激活用户可能会进入这里，可以跳过下面检查
      if(user.isActive){
        if(app.isMp){
          const checkText = this.data.extraFields.map(e=>e.key === 'cu'? `${e.name}${e.value}`: e.value).join('')
          await loadData(app.textContentSafetyCheck,checkText,'内容合规检查')
        }
      }
      app.emit(CardEditExtraDataEvent, extraFields)
    }else{
      app.emit(CardEditExtraDataEvent, [])
    }
    app.navigateBack()
  }
})