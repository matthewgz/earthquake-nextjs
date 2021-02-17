import Head from 'next/head'

const Helmet = (props) => {
  const { title } = props

  return (
    <Head>
      <title>{title}</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}

export default Helmet
