import { loadData} from '@/utils/index'
import { getUserManager } from '@/class/user'
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
      const createTime = new Date(log.createTime)
      log['time'] = createTime.toLocaleString('en',{hour12: false})
      if(log.type === 'coupon-exchange'){
        log['timeName'] = '兑换时间'
      }else{
        log['timeName'] = '消耗日期'
        log['time'] = new Date(createTime.setDate(createTime.getDate()-1)).toLocaleDateString()
      }
      setData['detail'] = log
      this.setData(setData)
    })
  }
})