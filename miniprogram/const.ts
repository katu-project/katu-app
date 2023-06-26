export const DefaultShowImage = '/static/images/image.svg'
export const DefaultShowLockImage = '/static/images/lock.svg'
export const DefaultLoadFailedImage = '/static/images/load-failed.svg'
export const DefaultUserAvatar = '/static/images/default-avatar.png'
export const DefaultAddImage = '/static/images/add.svg'
export const DefaultShareImage = '/static/share.png'
export const WX_CLOUD_STORAGE_FILE_HEAD = 'cloud://'

export const APP_ROOT_DIR = `${wx.env.USER_DATA_PATH}/katu`
export const APP_TEMP_DIR = `${APP_ROOT_DIR}/temp`
export const APP_DOWN_DIR = `${APP_ROOT_DIR}/down`
export const APP_IMAGE_DIR = `${APP_ROOT_DIR}/image`

// export const STANDARD_CARD_DATA = {
//   width: 85.60,
//   height: 53.98,
//   ratio: 0.63
// }

const _LocalCacheKeyMap = [
  "MASTER_KEY_CACHE_KEY",
  "HOME_DATA_CACHE_KEY",
  "CARD_EXTRA_DATA_CACHE_KEY",
  "CARD_DATA_CACHE_KEY",
  "ONCE_NOTICE_CACHE_KEY",
  "USER_INFO_CACHE_KEY",
  "SMS_LAST_SEND_TIME",
  "CACHE_CLEAR_TIME"
] as const

export const LocalCacheKeyMap = Object.fromEntries(_LocalCacheKeyMap.map(e=>[e,e])) as TupleToObject<typeof _LocalCacheKeyMap>

const _ONCE_NOTICE_KEYS = [
  "ENCRYPT_SAVE",
  "SHARE_DATA",
  "DATA_CHECK",
] as const

export const ONCE_NOTICE_KEYS = Object.fromEntries(_ONCE_NOTICE_KEYS.map(e=>[e,e])) as TupleToObject<typeof _ONCE_NOTICE_KEYS>

export const APP_ENTRY_PATH = 'home/index'

export const DEFAULT_IMAGE_HASH_METHOD = 'MD5'

export default {
  DefaultShowImage,
  DefaultShowLockImage,
  DefaultAddImage,
  DefaultLoadFailedImage,
  DefaultShareImage,
  DefaultUserAvatar,
  APP_ROOT_DIR,
  APP_TEMP_DIR,
  APP_DOWN_DIR,
  APP_IMAGE_DIR,
  // STANDARD_CARD_DATA,
  APP_ENTRY_PATH,
  WX_CLOUD_STORAGE_FILE_HEAD,
  LocalCacheKeyMap,
  ONCE_NOTICE_KEYS,
  DEFAULT_IMAGE_HASH_METHOD
}