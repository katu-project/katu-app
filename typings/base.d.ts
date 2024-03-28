interface String {
  replaceAll(pattern: any, replacement: string) : string;
}

interface functionDefaultOptions<T = any> {
  success?: (res: T) => void
  fail?: (err: any) => void
  complete?: () => void
}

interface requestSKProductsSuccess {
  invalidProductIdentifiers: string[]
  products: {
    isFamilyShareable: boolean
    localizedDescription: string
    localizedTitle: string
    price: number
    priceLocaleIdentifier: string
    productIdentifier: string
  }[]
}

interface PaymentByProductIdentifiersOptions extends functionDefaultOptions{
  productIdentifier: string
  applicationUsername?: string
  quantity?: number
}

type PaymentTransactionState = 'SKPaymentTransactionStatePurchasing' | 
                               'SKPaymentTransactionStatePurchased' |
                               'SKPaymentTransactionStateFailed' |
                               'SKPaymentTransactionStateRestored' |
                               'SKPaymentTransactionStateDeferred'
interface IAPTransaction {
  payment: PaymentByProductIdentifiersOptions
  transactionIdentifier: string
  tempTransactionIdentifier: string
  transactionReceipt: string
  transactionState: PaymentTransactionState
}

interface updatedTransactionsRes {
  transactions: IAPTransaction[]
}

interface IAPTransactionObserver {
  updatedTransactions?: (res: updatedTransactionsRes) => void 
  restoreCompletedTransactionsFailedWithError?: (res: any) => void
  paymentQueueRestoreCompletedTransactionsFinished?: (res: any) => void
  shouldAddStorePayment?: (res: any) => void
  paymentQueueDidChangeStorefront?: (res: any) => void
  didRevokeEntitlementsForProductIdentifiers?: (res: any) => void
}

interface finishTransactionOptions extends functionDefaultOptions {
  transactionIdentifier: string
}

declare namespace WechatMiniprogram {
  interface Console {
    time: (title:string)=>unknown
    timeEnd: (title:string)=>unknown
    table: (data:any)=>unknown
    
    trace: () => any
    _log: (...args) => void
    _warn: (...args) => void
    _debug: (...args) => void
    _error: (...args) => void
    _table: (data:any) => void
  }
  
  interface Wx {
    miniapp: {
      IAP: {
        requestSKProducts(args?: {productIdentifiers:string[]} & functionDefaultOptions<requestSKProductsSuccess>): unknown
        cancelRequestSKProducts(args): unknown
        addPaymentByProductIdentifiers(args?: PaymentByProductIdentifiersOptions): unknown
        addTransactionObserver(args: IAPTransactionObserver): unknown
        removeTransactionObserver(args: IAPTransactionObserver): unknown
        finishTransaction(args:finishTransactionOptions):unknown
        getTransactions(args: functionDefaultOptions<IAPTransaction[]>): unknown
        getAppStoreReceiptURL(args: functionDefaultOptions):unknown
        getAppStoreReceiptData(args: functionDefaultOptions):unknown
        requestSKReceiptRefreshRequest(args: functionDefaultOptions):unknown
      }
      launchMiniProgram(args: {
        userName: string,
        path?: string,
        miniprogramType?: number
      } & functionDefaultOptions): unknown
      openCustomerServiceChat(args: {corpId:string,url:string} & functionDefaultOptions): unknown
      hasWechatInstall(args?: functionDefaultOptions): unknown
    }
    restartMiniProgram(args?: {path:string} & functionDefaultOptions): unknown
    checkIdentitySession(args?: functionDefaultOptions): unknown
    appleLogin(args?:functionDefaultOptions): unknown
    weixinMiniProgramLogin(args?: functionDefaultOptions): unknown
    logout(args?: functionDefaultOptions): unknown
    openPrivacyContract(args:any): unknown
    getPrivacySetting(args:any): unknown
  }
}

declare namespace require {
  function async(path:string) : any
}

interface IAnyObject {
  [key:string]: any
}

type TupleToObject<T extends readonly (keyof any)[]> = {
  [P in T[number]]:P
}