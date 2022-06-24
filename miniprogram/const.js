const DefaultShowImage = '/static/images/image.svg'
const DefaultShowLockImage = '/static/images/lock.svg'

const APP_ROOT_DIR = `${wx.env.USER_DATA_PATH}/katu`
const APP_TEMP_DIR = `${APP_ROOT_DIR}/temp`
const MASTER_KEY_NAME = 'KATU_MASTER_KEY'
const KATU_MARK = '0000952700004396'

const STANDARD_CARD_DATA = {
  width: 85.60,
  height: 53.98,
  ratio: 53.98 / 85.60
}

module.exports = {
  DefaultShowImage,
  DefaultShowLockImage,
  MASTER_KEY_NAME,
  APP_ROOT_DIR,
  APP_TEMP_DIR,
  KATU_MARK,
  STANDARD_CARD_DATA
}