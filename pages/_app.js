import '../styles/globals.css'
import Context from 'context/index'
import { useUserAgent, withUserAgent } from 'next-useragent'

const MyApp = (props) => {
  const { Component, pageProps, ua } = props

  return (
    <Context.Provider isMobile={ua?.isMobile}>
      <Component {...pageProps} />
    </Context.Provider>
  )
}

export async function getServerSideProps() {
  const ua = useUserAgent(context.req.headers['user-agent'])

  return {
    props: { ua, useragent: ua.source },
  }
}

export default withUserAgent(MyApp)
