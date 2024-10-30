import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['cardEdit']
  },
  
  originValue: '',
  data: {
    content: '',
    dataChange: false
  },
  
  onLoad(options) {
    if(options.value){
      this.originValue = options.value
      this.setData({
        content: options.value
      })
    }
  },

  onBindInput(e){
    const content = e.detail.value.trim()
    this.setData({
      dataChange: this.originValue !== content,
      content
    })
  },

  async tapToSetContent(){
    const content = this.data.content.trim()
    // no active user can be skip csc
    if(user.isActive){
      if(app.isMp){
        await loadData(app.textContentSafetyCheck, content, this.t('content_safe_check'))
      }
    }
    app.publishCardEditTitleEvent(content)
    app.navigateBack()
  }
})