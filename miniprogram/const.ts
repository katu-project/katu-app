export const DefaultShowImage = '/static/images/image.svg'
export const DefaultShowLockImage = '/static/images/lock.svg'
export const DefaultLoadFailedImage = '/static/images/load-failed.svg'
export const DefaultUserAvatar = '/static/images/default-avatar.png'
export const DefaultAddImage = '/static/images/add.svg'
export const DefaultShareImage = '/static/share.png'
export const WX_CLOUD_STORAGE_FILE_HEAD = 'cloud://'

export const APP_ROOT_DIR = `${wx.env.USER_DATA_PATH}/katu`
export const APP_MINI_KEY_DIR = `${APP_ROOT_DIR}/mini-key`
export const APP_TEMP_DIR = `${APP_ROOT_DIR}/temp`
export const APP_DOWN_DIR = `${APP_ROOT_DIR}/down`
export const APP_IMAGE_DIR = `${APP_ROOT_DIR}/image`

// export const STANDARD_CARD_DATA = {
//   width: 85.60,
//   height: 53.98,
//   ratio: 0.63
// }

export const LOCAL_CACHE_KEYS = {
  MASTER_KEY_CACHE_KEY: "MASTER_KEY_CACHE_KEY",
  HOME_DATA_CACHE_KEY: "HOME_DATA_CACHE_KEY",
  CARD_EXTRA_DATA_CACHE_KEY: "CARD_EXTRA_DATA_CACHE_KEY",
  CARD_DATA_CACHE_KEY: "CARD_DATA_CACHE_KEY",
  ONCE_NOTICE_CACHE_KEY: "ONCE_NOTICE_CACHE_KEY",
  USER_INFO_CACHE_KEY: "USER_INFO_CACHE_KEY",
  SMS_LAST_SEND_TIME: "SMS_LAST_SEND_TIME",
  CACHE_CLEAR_TIME: "CACHE_CLEAR_TIME",
  LAST_LOGIN_UID: "LAST_LOGIN_UID",
  KATU_APP_TOKEN: "KATU_APP_TOKEN"
}

export const ONCE_NOTICE_KEYS = {
  ENCRYPT_SAVE: "ENCRYPT_SAVE",
  SHARE_DATA: "SHARE_DATA",
  DATA_CHECK: "DATA_CHECK"
}

export const MINI_KEY_LENGTH = 6

export default {
  DefaultShowImage,
  DefaultShowLockImage,
  DefaultAddImage,
  DefaultLoadFailedImage,
  DefaultShareImage,
  DefaultUserAvatar,
  APP_ROOT_DIR,
  APP_TEMP_DIR,
  APP_MINI_KEY_DIR,
  APP_DOWN_DIR,
  APP_IMAGE_DIR,
  // STANDARD_CARD_DATA,
  WX_CLOUD_STORAGE_FILE_HEAD,
  LOCAL_CACHE_KEYS,
  ONCE_NOTICE_KEYS,
  MINI_KEY_LENGTH
}