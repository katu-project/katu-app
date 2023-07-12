import { loadData, navigateBack } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()
const CardExtraDataFieldsKeys = app.getConfig('extraFieldsKeys')

Page({
  data: {
    extraFieldsKeys: CardExtraDataFieldsKeys,
    extraFields: [] as ICardExtraField[],
    dataChange: false
  },

  onLoad(options) {
    const parseExtraData = JSON.parse(options.value||'[]')
    if(options.value){
      let extraFieldsKeys = this.data.extraFieldsKeys
      const extraFields = app.rebuildExtraFields(parseExtraData)
      // 移除存在的项目
      extraFieldsKeys = extraFieldsKeys.filter(item=>{
        return item.key === 'cu' || !extraFields.some(e=>item.key === e.key)
      })
      this.setData({
        extraFieldsKeys,
        extraFields
      })
    }
    //不存在数据时根据tag来显示默认填写的字段
    if(!parseExtraData.length && options.tag){
      if(options.tag == 'dc'){
        this.addField([0])
      }else if(options.tag === 'cc'){
        this.addField([0,1,3])
      }
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
    this.addField([idx])
  },

  addField(ids){
    let extraFields = this.data.extraFields
    for (const idx of ids) {
      const extraField = Object.assign({},this.data.extraFieldsKeys[idx])
      if(extraField.key === 'cu'){
        extraField.name = ''
      }
      extraFields = extraFields.concat(extraField).sort((a,b)=> a.xid-b.xid)
    }
    
    this.setData({
      extraFields,
      extraFieldsKeys: this.data.extraFieldsKeys.filter((_,i)=> i === this.data.extraFieldsKeys.length-1 || !ids.includes(i))
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
      const extraFields = app.condenseExtraFields(this.data.extraFields)
      const checkText = this.data.extraFields.map(e=>e.key === 'cu'? `${e.name}${e.value}`: e.value).join('')
      await loadData(app.textContentSafetyCheck,checkText,'内容安全检查').catch(e=>app.showNotice(e.message))
      app.emit('setCardExtraData', extraFields)
    }else{
      app.emit('setCardExtraData', [])
    }
    navigateBack()
  }
})