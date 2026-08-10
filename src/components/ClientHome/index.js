'use client'

import dynamic from 'next/dynamic'
import styled from 'styled-components'

import Header from '../Header'
import Loader from '../Loader'
import Results from '../Results'
import useEarthquakes from '../../hooks/useEarthquakes'

const EarthquakeMap = dynamic(() => import('../EarthquakeMap'), {
  ssr: false,
  loading: () => <Loader fullHeight />,
})

const Container = styled.div`
  position: relative;
  height: 100dvh;

  & main {
    position: absolute;
    top: 60px;
    bottom: 0;
    right: 0;
    left: 0;
  }
`

export default function ClientHome({
  initialData,
  initialQuery,
  initialTotal,
}) {
  const {
    features,
    visible,
    total,
    truncated,
    status,
    error,
    hasMore,
    loadMore,
    retry,
  } = useEarthquakes({ initialData, initialQuery, initialTotal })

  return (
    <Container>
      <Header />
      <main>
        <Results
          data={visible}
          features={features}
          total={total}
          truncated={truncated}
          status={status}
          error={error}
          hasMore={hasMore}
          loadMore={loadMore}
          retry={retry}
        />
        <EarthquakeMap data={features} />
      </main>
    </Container>
  )
}
