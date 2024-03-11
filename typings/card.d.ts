interface ICard {
  _id: string
  title: string
  encrypted: boolean
  image: ICardImage[]
  tags: string[]
  info: any[]
  setLike: boolean

  _url?: string
}

interface ICardImage {
  hash: string
  url: string
  salt: string
  ccv: string

  _url?: string
}

interface ICardTag {
  _id?: string
  name: string
  color: string
  layout?: string
  field?: string[]
}

interface ICardExtraField {
  key: string
  name: string
  xid: number
  cid?: number
  value?: string
}

type CateItem = {
  name: string
  count: number
  color: string
}

interface ICardSummary {
  CateList: CateItem[]
  CardIdxs: string[]
  ImageIds: string[]
}

interface IHomeData {
  likeList: ICard[]
  cateList: CateItem[]
}

interface IHomeDataCache {
  cacheTime: number
  data: IHomeData
}