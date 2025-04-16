
const SYSTEM_INFO = uni.getSystemInfoSync()
const BASE_URL = SYSTEM_INFO.uniPlatform === 'web' ? '' : HOST;
export const HOST = 'https://cn.bing.com/';
export function request(config = {}) {
    let {
        url,
        data = {},
        method = "GET",
        header = {}
    } = config

    url = BASE_URL + url


    return new Promise((resolve, reject) => {
        uni.request({
            url,
            data,
            method,
            header,
            success: res => {
                if (res.statusCode === 200) {
                    resolve(res.data)
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
