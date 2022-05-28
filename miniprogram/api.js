
const request = (action, data={}) => {
  const error = {
    code: 0,
    message: ''
  }
  return new Promise((resolve,reject)=>{
    wx.cloud.callFunction({ name: 'api', data: { action, data } })
    .then(data=>{
      if(data.result.code === 0){
        resolve(data.result.data)
      }else{
        error.code = 1
        error.message = data.result.msg
        reject(error)
      }
    })
    .catch(err=>{
      error.message = err.message
      reject(error)
    })
})
}

module.exports = {
  request,
  getUser: () => request('user/getUser'),

  activeAccount: data => request('user/active', wx.cloud.CloudID(data.cloudId)),

  removeAccount: () => request('user/removeAccount'),
  
  saveCard: data=>{
    return request('user/saveCard', data)
  },
  getCard: data=>{
    return request('user/getCard', data)
  },
  deleteCard: id=>{
    return request('user/deleteCard', id)
  },
  getDoc: data => request('doc/getDoc', data)
}