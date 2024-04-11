import { loadData } from '@/utils/index'
import { getUserManager } from '@/controller/user'
const user = getUserManager()

Page({
  id: '',
  data: {
    loading: true,
    detail: {}
  },
  onLoad(options){
    if(options.id){
      this.id = options.id
    }
  },
  onReady(){
    
  },
  onShow(){
    this.loadData()
  },
  loadData(){
    loadData(user.getQuotaLogDetail,{_id:this.id}).then(log=>{
      const setData = {
        loading: false
      }
      setData['detail'] = log
      this.setData(setData)
    })
  }
})