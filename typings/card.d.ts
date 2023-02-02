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

  _url?: string
}

interface ICardTag {
  _id?: string
  name: string
  color?: string
  selected?: Boolean
}

interface ICardExtraField {
  key: string
  name: string
  xid: number
  cid?: number
  value?: string
}