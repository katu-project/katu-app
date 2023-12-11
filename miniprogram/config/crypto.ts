/**
 * useCommonCryptoVersion [ccv] cvv 决定各种加密算法的选择
 * 每次通过 cvv 选择相关算法时， 会把 cvv 填入 key pack 里以供读取 key pack 时使用。
 * 
 * usePackageVersion [pv] pv 控制每个卡片的加/解密协议
 * 加密卡片时通过该值选择对应的加密协议，pv 的值会被填入到加密卡片数据中
 * 在解密卡片数据时，先根据通用卡片数据格式读取 pv 值，再通过 pv 值选择使用对于的解密协议。
 */
const CryptoConfig: ICryptoConfig = {
  useCommonCryptoVersion: 'v0',
  usePackageVersion: 'v0'
}

export default CryptoConfig