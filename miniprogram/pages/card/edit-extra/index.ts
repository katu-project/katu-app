import { loadData, navigateBack, showChoose, showError } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
    extraFieldsKeys: app.getConfig('extraFieldsKeys'),
    extraFields: [] as ICardExtraField[],
    dataChange: false
  },
  onLoad(options) {
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
      dataChange: true
    }
    if(selectedField.key !== 'cu'){
      setData[`extraFieldsKeys`] = this.data.extraFieldsKeys.concat(app.getConfig('extraFieldsKeys').find(e=>e.key === selectedField.key)!).sort((a,b)=> a.xid-b.xid)
    }

    this.setData(setData)
  },
  async tapToSave(){
    if(this.data.extraFields.length){
      if(this.data.extraFields.some(field=>!field.value || !field.name)){
        showError('填写有误')
        return
      }
      const extraFields = app.condenseExtraFields(this.data.extraFields)
      const checkText = this.data.extraFields.map(e=>e.key === 'cu'? `${e.name}${e.value}`: e.value).join('')
      
      try {
        await loadData(app.textContentSafetyCheck,checkText,'内容安全检查')
      } catch (error) {
        showChoose("系统提示","数据存在不适内容?",{showCancel:false})
        return
      }

      app.emit('setCardExtraData', extraFields)
    }else{
      app.emit('setCardExtraData', [])
    }
    navigateBack()
  }
})