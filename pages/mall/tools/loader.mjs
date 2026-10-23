/**
 * Node ESM resolver 垫片（配合 reg.mjs 使用）
 * 为无扩展名的相对导入补上 .js 后缀
 */
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
