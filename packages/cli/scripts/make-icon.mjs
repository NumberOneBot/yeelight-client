import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const assets = resolve(dirname(fileURLToPath(import.meta.url)), '../assets')
const sizes = [256, 48, 32, 16]

const svg = await readFile(resolve(assets, 'icon-dark.svg'))
const pngs = await Promise.all(
  sizes.map((size) =>
    sharp(svg, { density: 384 })
      .resize(size, size, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  )
)

await writeFile(resolve(assets, 'icon-dark.ico'), await pngToIco(pngs))
