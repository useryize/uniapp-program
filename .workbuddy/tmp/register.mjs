import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
register(pathToFileURL(fileURLToPath(new URL('./loader.mjs', import.meta.url))).href)
