import { Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import Logo from '../components/Logo'

const basePath = process.env.NEXT_BASE_PATH ?? ''
const description =
  'Zero-dependency TypeScript library and CLI for local LAN control of Yeelight devices — no cloud, no Xiaomi account.'

export const metadata = {
  metadataBase: new URL('https://numberonebot.github.io'),
  title: {
    template: '%s – Yeelight Client',
    default: 'Yeelight Client'
  },
  description,
  openGraph: {
    type: 'website',
    siteName: 'Yeelight Client',
    title: 'Yeelight Client',
    description,
    url: `${basePath}/`,
    images: [
      {
        url: `${basePath}/og-image.png`,
        width: 1280,
        height: 640,
        alt: 'Yeelight Client interactive CLI — device selection'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yeelight Client',
    description,
    images: [`${basePath}/og-image.png`]
  }
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={
            <Navbar
              logo={
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Logo style={{ height: '48px', width: 'auto' }} />
                  <b>Yeelight Client</b>
                </span>
              }
            />
          }
          pageMap={await getPageMap()}
          footer={null}
          editLink={null}
          feedback={{ content: null }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
