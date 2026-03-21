import nextra from 'nextra'

const withNextra = nextra({})

const basePath = process.env.NEXT_BASE_PATH ?? ''

export default withNextra({
  output: 'export',
  basePath,
  images: { unoptimized: true }
})
