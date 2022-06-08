Component({
  data: {
    selected: 0,
    list:[
      {
        url: '/pages/home/index'
      },
      {
        url: '/pages/card/add/index'
      },
      {
        url: '/pages/profile/index'
      }
    ]
  },
  methods: {
    switchTab(e) {
      const tabIdx = parseInt(e.currentTarget.dataset.idx)
      const url = this.data.list[tabIdx].url
      if(tabIdx === 1){
        wx.navigateTo({
          url
        })
      }else{
        wx.switchTab({url})
        this.setData({
          selected: tabIdx
        })
      }
    }
  }
})
