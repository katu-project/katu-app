import { file, showChoose } from '@/utils/index'
import { APP_ROOT_DIR, APP_TEMP_DIR } from '@/const'
import { checkAccess, deleteFile } from '@/utils/file'
import { fileSizeFormat } from '@/utils/convert'

export {}

Page({
  rootPath: '',
  data: {
    dirPath: [] as string[],
    cwd: '/',
    files: [] as IAnyObject[]
  },
  onLoad(options) {
    this.rootPath = wx.env.USER_DATA_PATH
  },
  async onReady() {

  },
  async onShow(){
    console.log('getSavedFileList : ', await file.getSavedFileList());
    
    const files = await this.getDirFileList(this.rootPath)
    this.setData({
      cwd: this.rootPath?.slice(6),
      dirPath: [this.rootPath],
      files
    })
  },
  async getDirFileList(dirPath){
    try {
      await checkAccess(dirPath)
      const dir = await file.readdir(dirPath)
      const list:any[] = []
      for (const idx in dir) {
        const path = dir[idx]
        const stats = await file.getStats(`${dirPath}/${path}`)
        list.push({
          path,
          isDir: stats.isDirectory(),
          size: fileSizeFormat(stats.size)
        })
      }
      return list
    } catch (error) {
      console.log(error);
    }

    return []
  },
  async tapToSelectDir(e){
    console.log(e.currentTarget.dataset);
    const {path, dir} = e.currentTarget.dataset
    if(!dir){
      showChoose('文件信息',`${path}`,{
        cancelText: '修改',
        confirmText: '删除'
      }).then(res=>{
        if(res.confirm){
          deleteFile(this.data.dirPath.concat(path).join('/'))
            .then(()=>{
              this.setData({
                files: this.data.files.filter(e=>e.path !== path)
              })
            })
        }
      })
      return
    }
    const setData = {}
    setData['dirPath'] = this.data.dirPath.concat(path)
    setData['cwd'] = setData['dirPath'].join('/').slice(6)
    setData['files'] = await this.getDirFileList(setData['dirPath'].join('/'))
    this.setData(setData)
  },
  async tapToBack(){
    if(this.data.dirPath.length === 1) return
    const setData = {}
    setData['dirPath'] = this.data.dirPath.slice(0,-1)
    setData['cwd'] = setData['dirPath'].join('/').slice(6)
    setData['files'] = await this.getDirFileList(setData['dirPath'].join('/'))
    this.setData(setData)
  }
})