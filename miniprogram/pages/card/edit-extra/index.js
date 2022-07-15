const { navigateBack } = require("../../../utils/index")
const globalData = getApp().globalData

Page({
  data: {
    labels: globalData.app.Config.extraDataLabels,
    list: []
  },
  onLoad(options) {
    this.returnContentKey = options.returnContentKey || 'tempData'
    if(options.value){
      let labels = this.data.labels
      const list = JSON.parse(options.value).map(item=>{
        labels = labels.filter(e=>e.key !== item[0])
        const label = Object.assign({},this.data.labels.find(e=>e.key == item[0]))
        label.value = item[1]
        return label
      })
      this.setData({
        labels,
        list
      })
    }
  },
  onBindinput({currentTarget:{dataset: {idx}}, detail: {value}}){
    const key = `list[${idx}].value`
    this.setData({
      [key]: value
    })
  },
  onBindchange(e){
    const idx = parseInt(e.detail.value)
    if(!this.data.labels[idx]) return
    if(this.data.labels[idx].key === 'custom') {
      // const customLabel = Object.assign({},this.data.labels[idx])
      // const cid = this.data.list.filter(e=>e.key.startsWith('custom_')).length + 1
      // customLabel.name = `自定义_${cid}`
      // customLabel.key = `custom_${cid}`
      // const list = this.data.list.concat(customLabel)
      // this.setData({
      //   list
      // })
      return
    }

    const list = this.data.list.concat(this.data.labels[idx]).sort((a,b)=> a.xid-b.xid)
    const labels = this.data.labels.filter((e,i)=> i !== idx)
    
    this.setData({
      labels,
      list
    })
  },
  tapToRemoveLabel(e){
    const key = e.currentTarget.dataset.key
    if(key.startsWith('custom_')){
      return
    }

    const list = this.data.list.filter((e,i)=> e.key !== key)
    const labels = this.data.labels.concat(globalData.app.Config.extraDataLabels.find(e=>e.key === key)).sort((a,b)=> a.xid-b.xid)

    this.setData({
      labels,
      list
    })
  },
  tapToSave(){
    let miniData = JSON.stringify(this.data.list.map(e=>([e.key,e.value])))
    if(miniData === '[]') miniData = ''
    navigateBack({[this.returnContentKey]: miniData})
  }
})