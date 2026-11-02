export interface MallSku {
  id: number
  colorId: number
  size: string
  price: number
  stock: number
}

export interface MallColor {
  id: number
  name: string
  hex: string
}

export interface GoodsDetail {
  id: number
  title: string
  description: string
  color: string
  cover: string
  images: string[]
  originPrice: number
  sales: number
  colors: MallColor[]
  sizes: string[]
  skuList: MallSku[]
}
