import Core from '@/class/core'

export default class Module extends Core {
    LocalCacheKeyMap = this.getConst('LocalCacheKeyMap')
    ONCE_NOTICE_KEYS = this.getConst('ONCE_NOTICE_KEYS')
}