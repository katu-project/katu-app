async function showInfo(msg, typeIdx=3, mask=true){
  const type = ['success', 'error', 'loading', 'none']
  return wx.showToast({
    title: msg,
    icon: type[typeIdx],
    mask,
  })
}

// showChoose(title,content)
async function showChoose(title, content, options={}){
  return new Promise((resolve,reject)=>{
    wx.showModal({
      title,
      content,
      ...options
    }).then(({confirm, content})=>{
      if(confirm) return resolve(content)
      return reject()
    }).catch(reject)
  })
}

async function navigateTo(page){
  wx.vibrateShort({
    type: 'light',
  })
  wx.navigateTo({
    url: page,
  })
}

module.exports = {
  showInfo,
  showChoose,
  navigateTo
}