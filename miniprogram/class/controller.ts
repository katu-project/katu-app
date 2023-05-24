import Agent from '@/class/agent'
import api from "@/api"

export default class Controller extends Agent {
  async uploadFile(filePath:string, type:UploadFileType) {
    const uploadInfo = await api.getUploadInfo({ type })
    return api.uploadFile({ filePath, ...uploadInfo })
  }
}