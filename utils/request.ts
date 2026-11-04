
export const HOST = 'https://api.pexels.com';
const SYSTEM_INFO = uni.getSystemInfoSync()
const BASE_URL = SYSTEM_INFO.uniPlatform === 'web' ? '' : HOST;
const Authorization = "JKDmKuqZkQlCK8SG9RVgp0JSn8LLb12MQULnraxzkJVwGqil7oyQ1Ot4"


export interface PexelsPhoto {
    id: number
    index?: number
    alt?: string
    src: { large: string; [size: string]: string }
    [key: string]: unknown
}

export interface PexelsResponse {
    photos: PexelsPhoto[]
}

export function request(config: { url: string; data?: Record<string, string>; method?: UniApp.RequestOptions['method']; header?: Record<string, string> }) {
    let {
        url,
        data = {},
        method = "GET",
        header = {}
    } = config

    url = BASE_URL + url

    return new Promise<PexelsResponse>((resolve, reject) => {
        uni.request({
            url,
            data,
            method,
            header: {
                Authorization
            },
            success: res => {
                if (res.statusCode === 200) {
                    resolve(res.data as unknown as PexelsResponse)
                } else {
                    uni.showModal({
                        title: "错误提示",
                        content: res.errMsg,
                        showCancel: false
                    })
                    reject(res.data)
                }
            },
            fail: err => {
                reject(err)
            }
        })
    })
}

export const getSearch = () => {

}
