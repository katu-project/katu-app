
const request = (action, data={}) => {
  return new Promise((resolve,reject)=>{
    wx.cloud.callFunction({ name: 'api', data: { action, data } })
    .then(data=>{
      if(data.result.code === 0){
        resolve(data.result.data)
      }else{
        reject(Error(data.result.msg))
      }
    })
    .catch(reject)
})
}

module.exports = {
  getUser: ()=>{
    return request('user/getUser')
  },
  saveCard: data=>{
    return request('user/saveCard', data)
  },
  getCard: data=>{
    return request('user/getCard', data)
  },
  deleteCard: id=>{
    return request('user/deleteCard', id)
  }
}