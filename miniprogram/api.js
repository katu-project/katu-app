
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
        error.code = result.code
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
  
  getCard: data => request('card/fetch', data),

  saveCard: data => request('card/save', data),
  
  deleteCard: id => request('card/delete', id),

  getDoc: data => request('doc/getDoc', data)
}