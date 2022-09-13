const DefaultShowImage = '/static/images/image.svg'
const DefaultShowLockImage = '/static/images/lock.svg'
const DefaultAddImage = '/static/images/add.svg'

const APP_ROOT_DIR = `${wx.env.USER_DATA_PATH}/katu`
const APP_TEMP_DIR = `${APP_ROOT_DIR}/temp`
const MASTER_KEY_NAME = 'KATU_MASTER_KEY'
const KATU_MARK = '0000952700004396'
const PACKAGE_TAIL_LENGTH = 48

const STANDARD_CARD_DATA = {
  width: 85.60,
  height: 53.98,
  ratio: 53.98 / 85.60
}

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

export {
  DefaultShowImage,
  DefaultShowLockImage,
  DefaultAddImage,
  MASTER_KEY_NAME,
  APP_ROOT_DIR,
  APP_TEMP_DIR,
  KATU_MARK,
  PACKAGE_TAIL_LENGTH,
  STANDARD_CARD_DATA,
  PAGES_MENU
}