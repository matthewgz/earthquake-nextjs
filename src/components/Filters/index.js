import React, { useContext } from 'react'
import dynamic from 'next/dynamic'

import Loader from 'components/Loader'
import { Context } from 'context/index'

const Desktop = dynamic(() => import('./index.desktop'), {
  loading: () => <Loader />,
})

const Mobile = dynamic(() => import('./index.mobile'), {
  loading: () => <Loader />,
})

const Filters = () => {
  const { isMobile } = useContext(Context)

  return isMobile ? <Mobile /> : <Desktop />
}

export default Filters
