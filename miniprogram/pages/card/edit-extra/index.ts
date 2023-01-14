import { navigateBack, showError } from '@/utils/index'
import { getAppManager } from '@/class/app'
const app = getAppManager()

Page({
  returnContentKey: '',
  data: {
    extraFieldsKeys: app.Config.extraFieldsKeys,
    extraFields: [] as ICardExtraField[],
    dataChange: false
  },
  onLoad(options) {
    this.returnContentKey = options.returnContentKey || 'tempData'
    if(options.value){
      let extraFieldsKeys = this.data.extraFieldsKeys
      const extraFields = app.rebuildExtraFields(JSON.parse(options.value))
      extraFieldsKeys = extraFieldsKeys.filter(item=>{
        return item.key === 'cu' || !extraFields.some(e=>item.key === e.key)
      })
      this.setData({
        extraFieldsKeys,
        extraFields
      })
    }
  },
  onBindinput({currentTarget:{dataset: {idx, cu}}, detail: {value}}){
    const key = `extraFields[${idx}].${cu?'name':'value'}`
    this.setData({
      dataChange: value ? true : false,
      [key]: value
    })
  },
  onBindchange(e){
    const idx = parseInt(e.detail.value)
    if(!this.data.extraFieldsKeys[idx]) return

    const extraField = Object.assign({},this.data.extraFieldsKeys[idx])
 
    if(extraField.key === 'cu'){
      extraField.name = ''
    }else{
      this.data.extraFieldsKeys.splice(idx,1)
    }

    const extraFields = this.data.extraFields.concat(extraField).sort((a,b)=> a.xid-b.xid)
    this.setData({
      extraFields,
      extraFieldsKeys: this.data.extraFieldsKeys
    })
  },
  onBindDateChange({currentTarget:{dataset: {idx}}, detail: {value}}){
    const key = `extraFields[${idx}].value`
    this.setData({
      dataChange: value ? true : false,
      [key]: value
    })
  },
  tapToRemoveField(e){
    const idx = parseInt(e.currentTarget.dataset.idx)
    const selectedField = this.data.extraFields[idx]

    this.data.extraFields.splice(idx,1)
    const setData = {
      extraFields: this.data.extraFields,
      dataChange: this.data.extraFields.length > 0
    }
    if(selectedField.key !== 'cu'){
      setData[`extraFieldsKeys`] = this.data.extraFieldsKeys.concat(app.Config.extraFieldsKeys.find(e=>e.key === selectedField.key)!).sort((a,b)=> a.xid-b.xid)
    }

    this.setData(setData)
  },
  tapToSave(){
    if(this.data.extraFields.some(field=>!field.value || !field.name)){
      showError('填写有误')
      return
    }
    const extraFields = JSON.stringify(app.condenseExtraFields(this.data.extraFields))
    navigateBack({backData: {[this.returnContentKey]: extraFields}})
  }
})