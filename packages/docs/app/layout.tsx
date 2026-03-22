import { Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import Logo from '../components/Logo'

export const metadata = {
  title: {
    template: '%s – Yeelight Client',
    default: 'Yeelight Client'
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
