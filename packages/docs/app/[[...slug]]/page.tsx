import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents } from '../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('slug')

type Props = {
  params: Promise<{ slug?: string[] }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const { metadata } = await importPage(slug)
  return metadata
}

const Wrapper = useMDXComponents().wrapper

export default async function Page({ params }: Props) {
  const { slug } = await params
  const result = await importPage(slug)
  const { default: MDXContent, toc, metadata, sourceCode } = result
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent params={await params} />
    </Wrapper>
  )
}
