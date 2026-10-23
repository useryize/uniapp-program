// 补齐 Node ESM 对无扩展名相对导入的解析（uni-app 由 vite 负责，此处仅供 Node 直跑冒烟测试）
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (e) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
      return next(specifier + '.js', context)
    }
    throw e
  }
}
