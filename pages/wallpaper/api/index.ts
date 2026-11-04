import { fetchFeatured, fetchWallpapers } from './source/commons'
import type { Wallpaper, WallpaperSearchOptions } from './types'

export type { Wallpaper, WallpaperCategory, WallpaperTone, WallpaperSort, WallpaperSearchOptions } from './types'

const FAVORITES_KEY = 'wallpaper:favorites:v1'
const PREVIEW_KEY = 'wallpaper:preview:v1'

function readWallpapers(key: string): Wallpaper[] {
  try {
    const value: unknown = uni.getStorageSync(key)
    return Array.isArray(value) ? value as Wallpaper[] : []
  } catch {
    return []
  }
}

export const wallpaperApi = {
  featured: fetchFeatured,
  search: fetchWallpapers,
  favorites: (): Wallpaper[] => readWallpapers(FAVORITES_KEY),
  isFavorite: (id: string): boolean => readWallpapers(FAVORITES_KEY).some(item => item.id === id),
  toggleFavorite(wallpaper: Wallpaper): boolean {
    const current = readWallpapers(FAVORITES_KEY)
    const exists = current.some(item => item.id === wallpaper.id)
    uni.setStorageSync(FAVORITES_KEY, exists ? current.filter(item => item.id !== wallpaper.id) : [wallpaper, ...current])
    return !exists
  },
  setPreviewList(items: Wallpaper[]): void { uni.setStorageSync(PREVIEW_KEY, items) },
  previewList: (): Wallpaper[] => readWallpapers(PREVIEW_KEY),
  async save(wallpaper: Wallpaper): Promise<void> {
    const filePath = await new Promise<string>((resolve, reject) => {
      uni.downloadFile({
        url: wallpaper.imageUrl,
        success: (result) => result.statusCode === 200
          ? resolve(result.tempFilePath)
          : reject(new Error(`图片下载失败 (${result.statusCode})`)),
        fail: reject
      })
    })
    await new Promise<void>((resolve, reject) => {
      uni.saveImageToPhotosAlbum({ filePath, success: () => resolve(), fail: reject })
    })
  }
}
