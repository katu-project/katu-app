
const request = (action, data={}) => {
  const error = {
    code: 0,
    message: ''
  }
  return new Promise((resolve,reject)=>{
    wx.cloud.callFunction({ name: 'api', data: { action, data } })
    .then(({result})=>{
      if(result.code === 0){
        resolve(result.data)
      }else{
        error.message = result.msg
        error.code = result.code // 1 业务报错 其他 系统错误
        reject(error)
      }
    })
    .catch(err=>{
      error.message = err.message
      error.code = 600 // 云函数报错
      reject(error)
    })
})
}

module.exports = {
  request,
  getUser: () => request('user/getUser'),

  activeAccount: data => request('user/active', wx.cloud.CloudID(data.cloudId)),

  removeAccount: () => request('user/removeAccount'),
  
  usageStatistic: () => request('user/usage'),

  getCard: data => request('card/fetch', data),

  saveCard: data => request('card/save', data),
  
  deleteCard: id => request('card/delete', id),

  getDoc: data => request('doc/getDoc', data)
}