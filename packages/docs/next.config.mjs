import nextra from 'nextra'
import { fileURLToPath } from 'url'
import path from 'path'

const withNextra = nextra({})

const basePath = process.env.NEXT_BASE_PATH ?? ''
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default withNextra({
  output: 'export',
  basePath,
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname, '../..')
})
