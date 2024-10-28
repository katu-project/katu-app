import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { getCardManager } from '@/controller/card'
const app = getAppManager()
const cardManager = getCardManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['cardEdit']
  },

  originValue: '',
  useTag: '',
  originExtraFieldsKeys: [] as ICardExtraField[],

  data: {
    extraFieldsKeys: [] as AnyObject[],
    extraFields: [] as AnyObject[]
  },

  onLoad(options) {
    this.originValue = options.value || '[]'
    this.useTag = options.tag || ''
    this.originExtraFieldsKeys = app.getCardConfig('defaultFields').map(e=>{
      e.name = app.t(e.key,[],'extraData')
      return e
    })
  },

  onReady() {
    let extraFieldItems = this.originExtraFieldsKeys
    this.data.extraFieldsKeys = extraFieldItems

    const parseExtraData = JSON.parse(this.originValue)
    if(parseExtraData.length){
      const extraFields = cardManager.rebuildExtraFields(parseExtraData)
      // remove exist item
      extraFieldItems = extraFieldItems.filter(item=>{
        return item.key === 'cu' || !extraFields.some(e=>item.key === e.key)
      })
      this.setData({
        extraFields
      })
    }else{
      // use tag default fields
      if(this.useTag){
        const checkFieldTag = app.getCardConfig('defaultTags').find(tag=>tag.name === this.useTag)
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
    const extraFields = this.data.extraFields
    for (const key of keys) {
      const extraField = Object.assign({},this.originExtraFieldsKeys.find(e=>e.key === key))
      if(extraField.key === 'cu'){
        extraField.name = `${this.t('field')} ${extraFields.filter(e=>e.key==='cu').length+1}`
      }
      extraFields.push(extraField)
    }
    this.setData({
      extraFields: extraFields.sort((a,b)=> a.xid-b.xid),
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
      setData[`extraFieldsKeys`] = this.data.extraFieldsKeys.concat(this.originExtraFieldsKeys.find(e=>e.key === selectedField.key)!).sort((a,b)=> a.xid-b.xid)
    }

    this.setData(setData)
  },

  async tapToSave(){
    if(this.data.extraFields.length){
      if(this.data.extraFields.some(field=>!field.value || !field.name)){
        app.showNotice(this.t('field_not_fill'))
        return
      }
      const extraFields = cardManager.condenseExtraFields(this.data.extraFields as ICardExtraField[])

      if(this.originValue === JSON.stringify(extraFields)) {
        app.showNotice(this.t('data_no_change'))
        return
      }
      
      // no active user can be skip csc
      if(user.isActive){
        if(app.isMp){
          const checkText = this.data.extraFields.map(e=>e.key === 'cu'? `${e.name}${e.value}`: e.value).join('')
          await loadData(app.textContentSafetyCheck,checkText, this.t('content_safe_check'))
        }
      }
      app.publishCardEditExtraDataEvent(extraFields)
    }else{
      app.publishCardEditExtraDataEvent([])
    }
    app.navigateBack()
  }
})