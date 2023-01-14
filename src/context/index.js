import React, { createContext, useState } from 'react'
import moment from 'moment'
import { MIN_MAGNITUDE } from 'utils/constants'

export const Context = createContext(null)

const Provider = (props) => {
  const { children, isMobile: mobile } = props

  const [showFilters, setShowFilters] = useState(false)

  const [showResults, setShowResults] = useState(false)

  const [minMagnitude, setMinMagnitude] = useState(MIN_MAGNITUDE)

  const [marker, setMarker] = useState({
    id: null,
    position: null,
    zoom: 4,
  })

  const [isMobile] = useState(mobile)

  const [dates, setDates] = useState({
    to: moment().format('YYYY-MM-DDT00:00:00'),
    from: moment().format('YYYY-MM-DDT23:59:59'),
  })

  const value = {
    showFilters,
    showResults,
    minMagnitude,
    dates,
    isMobile,
    marker,
    setShowFilters,
    setShowResults,
    setMinMagnitude,
    setDates,
    setMarker,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}
export default {
  Provider,
  Consumer: Context.Consumer,
}
