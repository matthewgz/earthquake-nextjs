import Head from 'next/head'

const Helmet = (props) => {
  const { title } = props

  const description =
    'Con esta web podras visualizar sismos en determinado rango de fechas y filtrar por magnitud.'

  return (
    <Head>
      <meta charSet="UTF-8" />
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      <meta name="keywords" content="earthquakes, sismos, terremoto, temblor" />
      <meta name="author" content="Matthew Rosell" />
      <link rel="icon" href="/favicon.ico" />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={process.env.NEXT_PUBLIC_ENV_URL_APP} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="/preview.png" />

      <meta property="twitter:card" content="summary_large_image" />
      <meta
        property="twitter:url"
        content={process.env.NEXT_PUBLIC_ENV_URL_APP}
      />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content="/preview.png" />
    </Head>
  )
}

export default Helmet
