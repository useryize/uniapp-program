/**
 * uni-app SFC 编译校验
 * 逐个解析 .vue：template 结构 + script 语法 + style(SCSS) 编译
 * 商城页面和组件自行引入 styles/tokens.scss
 * 运行：node pages/mall/tools/check-vue.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { parse, compileTemplate, compileScript } from '@vue/compiler-sfc'
import * as sass from 'sass'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(import.meta.dirname, '../../..')
const SRC = path.join(ROOT, 'pages/mall')
const UNI_SCSS = fs.readFileSync(path.join(ROOT, 'uni.scss'), 'utf8')

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (f.endsWith('.vue')) out.push(p)
  }
  return out
}

let pass = 0
let fail = 0
const problems = []

for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  const source = fs.readFileSync(file, 'utf8')
  const id = rel
  try {
    const { descriptor, errors } = parse(source, { filename: file })
    if (errors && errors.length) {
      throw new Error(errors.map((e) => e.message).join('; '))
    }

    // script
    if (descriptor.script || descriptor.scriptSetup) {
      const res = compileScript(descriptor, { id })
      if (!res) throw new Error('compileScript 失败')
    }

    // template
    if (descriptor.template) {
      const r = compileTemplate({
        source: descriptor.template.content,
        filename: file,
        id,
        compilerOptions: { isCustomElement: () => false }
      })
      if (r.errors && r.errors.length) {
        throw new Error('template: ' + r.errors.map((e) => e.message || e).join('; '))
      }
    }

    // style (SCSS)
    const styles = descriptor.styles || []
    for (const s of styles) {
      if (s.content.includes('$rz-') && s.lang !== 'scss') {
        throw new Error('使用设计变量的样式块必须声明 lang="scss"')
      }
      if (s.lang !== 'scss' && s.lang !== 'sass') continue
      const res = sass.compileString(`${UNI_SCSS}\n${s.content}`, {
        url: pathToFileURL(file),
        loadPaths: [path.dirname(file), path.join(ROOT, 'node_modules')],
        importers: [
          {
            findFileUrl(url) {
              if (url === 'uni.scss') return new URL('file:///' + path.join(ROOT, 'uni.scss').replace(/\\/g, '/'))
              return null
            }
          }
        ],
        // uni.scss 里的 $uni-* 变量以「注释掉声明」形式存在时也能编译
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'mixed-decls']
      })
      if (!res.css) throw new Error('style 编译无输出')
    }

    pass++
    console.log('  PASS  ' + rel)
  } catch (e) {
    fail++
    problems.push(rel + '  ->  ' + e.message)
    console.log('  FAIL  ' + rel + '  ->  ' + e.message)
  }
}

console.log('\n========================================')
console.log('  SFC 编译校验：通过 ' + pass + ' / 失败 ' + fail)
console.log('========================================')
if (problems.length) {
  console.log('\n失败明细：')
  problems.forEach((p) => console.log('  - ' + p))
}
process.exit(fail ? 1 : 0)
