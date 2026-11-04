export type WallpaperCategory = '全部' | '自然' | '城市' | '抽象' | '花植'
export type WallpaperTone = '全部' | '青绿' | '蓝色' | '暖橙' | '深色' | '粉色' | '米白'
export type WallpaperSort = 'featured' | 'new' | 'dark'

export interface Wallpaper {
  id: string
  fileTitle: string
  title: string
  category: WallpaperCategory
  thumbnailUrl: string
  imageUrl: string
  sourceUrl: string
  creator: string
  license: string
  licenseUrl: string
  width: number
  height: number
}

export interface WallpaperSearchOptions {
  category: WallpaperCategory
  keyword: string
  tone: WallpaperTone
  sort: WallpaperSort
  cursor?: string
}

export interface WallpaperSearchResult {
  items: Wallpaper[]
  nextCursor?: string
}
