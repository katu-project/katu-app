async function sleep(t=1000){
  return new Promise((resolve,reject)=>{
    setTimeout(resolve,t)
  })
}

module.exports = {
  sleep
}