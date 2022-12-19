const DefaultShowImage = '/static/images/image.svg'
const DefaultShowLockImage = '/static/images/lock.svg'
const DefaultLoadFailedImage = '/static/images/load-failed.svg'
const DefaultAddImage = '/static/images/add.svg'
const DefaultShareImage = '/static/share.png'
const WX_CLOUD_STORAGE_FILE_HEAD = 'cloud://'

const APP_ROOT_DIR = `${wx.env.USER_DATA_PATH}/katu`
const APP_TEMP_DIR = `${APP_ROOT_DIR}/temp`
const APP_DOWN_DIR = `${APP_ROOT_DIR}/down`
const APP_IMAGE_DIR = `${APP_ROOT_DIR}/image`

const MASTER_KEY_NAME = 'KATU_MASTER_KEY'
const CARD_LABEL_CACHE_KEY = 'CARD_LABEL_CACHE_KEY'
const KATU_MARK = '0000952700004396'
const PACKAGE_TAIL_LENGTH = 48

const ENCRYPTED_IMAGE_CACHE_SUFFIX = 'enc'
const DECRYPTED_IMAGE_CACHE_SUFFIX = 'dec'
const DOWNLOAD_IMAGE_CACHE_SUFFIX = 'down'

const STANDARD_CARD_DATA = {
  width: 85.60,
  height: 53.98,
  ratio: 53.98 / 85.60
}

const ColorList = [
  {
    title: '嫣红',
    name: 'red',
    color: '#e54d42'
  },
  {
    title: '桔橙',
    name: 'orange',
    color: '#f37b1d'
  },
  {
    title: '明黄',
    name: 'yellow',
    color: '#fbbd08'
  },
  {
    title: '橄榄',
    name: 'olive',
    color: '#8dc63f'
  },
  {
    title: '森绿',
    name: 'green',
    color: '#39b54a'
  },
  {
    title: '天青',
    name: 'cyan',
    color: '#1cbbb4'
  },
  {
    title: '海蓝',
    name: 'blue',
    color: '#0081ff'
  },
  {
    title: '姹紫',
    name: 'purple',
    color: '#6739b6'
  },
  {
    title: '木槿',
    name: 'mauve',
    color: '#9c26b0'
  },
  {
    title: '桃粉',
    name: 'pink',
    color: '#e03997'
  },
  {
    title: '棕褐',
    name: 'brown',
    color: '#a5673f'
  },
  {
    title: '玄灰',
    name: 'grey',
    color: '#8799a3'
  },
  {
    title: '草灰',
    name: 'gray',
    color: '#aaaaaa'
  },
  {
    title: '墨黑',
    name: 'black',
    color: '#333333'
  },
  {
    title: '雅白',
    name: 'white',
    color: '#ffffff'
  },
]
const PAGES_MENU = {
  profile: [
    {
      icon: 'tag',
      name: '标签管理',
      url: '../card/edit-tag/index'
    },
    {
      icon: 'question',
      name: '使用帮助 ( Q&A )',
      url: '../qa/index'
    },
    {
      icon: 'info',
      name: '关于卡兔',
      url: '../about/index'
    }
  ]
}

const LocalCacheKeyMap = {
  knowShareNotice: 'knowShareNotice',
  knowEncryptSave: 'knowEncryptSave'
}

const APP_ENTRY_PATH = 'home/index'

export {
  DefaultShowImage,
  DefaultShowLockImage,
  DefaultAddImage,
  DefaultLoadFailedImage,
  DefaultShareImage,
  MASTER_KEY_NAME,
  APP_ROOT_DIR,
  APP_TEMP_DIR,
  APP_DOWN_DIR,
  APP_IMAGE_DIR,
  KATU_MARK,
  PACKAGE_TAIL_LENGTH,
  STANDARD_CARD_DATA,
  PAGES_MENU,
  ColorList,
  APP_ENTRY_PATH,
  CARD_LABEL_CACHE_KEY,
  WX_CLOUD_STORAGE_FILE_HEAD,
  ENCRYPTED_IMAGE_CACHE_SUFFIX,
  DECRYPTED_IMAGE_CACHE_SUFFIX,
  DOWNLOAD_IMAGE_CACHE_SUFFIX,
  LocalCacheKeyMap
}