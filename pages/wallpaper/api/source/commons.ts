import type { Wallpaper, WallpaperCategory, WallpaperSearchOptions, WallpaperSearchResult } from '../types'

const API_URL = 'https://commons.wikimedia.org/w/api.php'

interface CommonsMetaValue { value?: string }
interface CommonsImageInfo {
  url?: string
  thumburl?: string
  width?: number
  height?: number
  mime?: string
  extmetadata?: Record<string, CommonsMetaValue>
}
interface CommonsPage {
  pageid?: number
  index?: number
  title: string
  missing?: boolean
  imageinfo?: CommonsImageInfo[]
}
interface CommonsResponse {
  query?: { pages?: CommonsPage[] }
  continue?: { gsroffset?: number }
  error?: { info?: string }
}

const FEATURED: Array<{ title: string; name: string; category: WallpaperCategory }> = [
  { title: 'File:August 2007, Forest near Helsinki airport 2.jpg', name: '林间晨光', category: '自然' },
  { title: 'File:Seascape, St Leonards-on-sea 01.jpg', name: '海岸来信', category: '自然' },
  { title: 'File:Flower full bloom.jpg', name: '盛放时刻', category: '花植' },
  { title: 'File:Château Frontenac in Quebec city, Canada colorfull.jpg', name: '暮色之城', category: '城市' },
  { title: 'File:Sea view from Palma Cathedral.jpg', name: '岛屿晴空', category: '自然' },
  { title: 'File:Flower full bloom 2.jpg', name: '花影之间', category: '花植' },
  { title: 'File:Landscape Painting 01.jpg', name: '山野画卷', category: '抽象' },
  { title: 'File:2025 Smart City by night.jpg', name: '夜的轮廓', category: '城市' }
]

const CATEGORY_QUERY: Record<WallpaperCategory, string> = {
  全部: 'nature',
  自然: 'forest landscape',
  城市: 'city architecture',
  抽象: 'abstract painting',
  花植: 'flower botanical'
}

const TONE_QUERY: Record<string, string> = {
  青绿: 'green', 蓝色: 'blue', 暖橙: 'orange', 深色: 'night', 粉色: 'pink', 米白: 'beige'
}

const KEYWORD_QUERY: Record<string, string> = {
  海: 'sea', 海岸: 'seascape', 山: 'mountain', 森林: 'forest', 花: 'flower', 城市: 'city', 夜景: 'night city', 抽象: 'abstract'
}

function plainText(value: string | undefined): string {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function requestCommons(data: Record<string, string | number>): Promise<CommonsResponse> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_URL,
      method: 'GET',
      data: { action: 'query', format: 'json', formatversion: 2, origin: '*', ...data },
      timeout: 15000,
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Commons HTTP ${res.statusCode}`))
          return
        }
        const body = res.data as CommonsResponse
        if (body.error) reject(new Error(body.error.info || 'Commons API 错误'))
        else resolve(body)
      },
      fail: (error) => reject(error)
    })
  })
}

function normalize(page: CommonsPage, category: WallpaperCategory, name?: string): Wallpaper | null {
  const info = page.imageinfo?.[0]
  const meta = info?.extmetadata
  // 仅呈现 Commons 标记为 CC0 的竖图；源站标注仍需在正式运营前逐张核对。
  if (!info?.url || !info.width || !info.height || info.height <= info.width || info.width < 1000) return null
  if (!['image/jpeg', 'image/png'].includes(info.mime || '')) return null
  if (meta?.LicenseShortName?.value !== 'CC0') return null
  return {
    id: String(page.pageid || page.title),
    fileTitle: page.title,
    title: name || page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
    category,
    thumbnailUrl: info.thumburl || info.url,
    imageUrl: info.url,
    sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    creator: plainText(meta.Artist?.value) || 'Wikimedia Commons 贡献者',
    license: 'CC0',
    licenseUrl: meta.LicenseUrl?.value || 'https://creativecommons.org/publicdomain/zero/1.0/',
    width: info.width,
    height: info.height
  }
}

let featuredCache: Wallpaper[] | null = null

export async function fetchFeatured(refresh = false): Promise<Wallpaper[]> {
  if (featuredCache && !refresh) return featuredCache
  const response = await requestCommons({
    titles: FEATURED.map(item => item.title).join('|'),
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: 600
  })
  const byTitle = new Map((response.query?.pages || []).map(page => [page.title, page]))
  featuredCache = FEATURED.flatMap(item => {
    const page = byTitle.get(item.title)
    const wallpaper = page ? normalize(page, item.category, item.name) : null
    return wallpaper ? [wallpaper] : []
  })
  return featuredCache
}

export async function fetchWallpapers(options: WallpaperSearchOptions): Promise<WallpaperSearchResult> {
  const keyword = options.keyword.trim()
  const searchWord = KEYWORD_QUERY[keyword] || keyword || CATEGORY_QUERY[options.category]
  const categoryWord = keyword && options.category !== '全部' ? ` ${CATEGORY_QUERY[options.category]}` : ''
  const toneWord = options.tone === '全部' ? '' : ` ${TONE_QUERY[options.tone] || ''}`
  const darkWord = options.sort === 'dark' && options.tone === '全部' ? ' night' : ''
  const query = `${searchWord}${categoryWord}${toneWord}${darkWord} incategory:"CC-Zero" filetype:bitmap`
  const data: Record<string, string | number> = {
    generator: 'search', gsrsearch: query, gsrnamespace: 6, gsrlimit: 50,
    gsrsort: options.sort === 'new' ? 'create_timestamp_desc' : 'relevance',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: 450
  }
  if (options.cursor) data.gsroffset = Number(options.cursor)
  const items: Wallpaper[] = []
  let nextCursor: string | undefined
  // 搜索命中的是文件名；竖图和许可筛选后可能整页为空，再取一页避免误报无结果。
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await requestCommons(data)
    items.push(...(response.query?.pages || [])
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .flatMap(page => {
        const wallpaper = normalize(page, options.category)
        return wallpaper ? [wallpaper] : []
      }))
    nextCursor = response.continue?.gsroffset === undefined ? undefined : String(response.continue.gsroffset)
    if (items.length || !nextCursor) break
    data.gsroffset = Number(nextCursor)
  }
  return { items, nextCursor }
}
