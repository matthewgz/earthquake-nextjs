import React, { useContext } from 'react'
import dynamic from 'next/dynamic'
import { Context } from 'context/index'
import moment from 'moment'

const Desktop = dynamic(() => import('./index.desktop'))

const Mobile = dynamic(() => import('./index.mobile'))

const Filters = () => {
  const { dates, setDates, isMobile } = useContext(Context)

  const handleToDate = (day, modifiers) => {
    if (modifiers?.disabled) {
      return
    }

    setDates({ ...dates, to: moment(day).format('YYYY-MM-DDT00:00:00') })
  }

  const handleFromDate = (day, modifiers) => {
    if (modifiers?.disabled) {
      return
    }

    setDates({ ...dates, from: moment(day).format('YYYY-MM-DDT23:59:59') })
  }

  return (
    <>
      {isMobile ? (
        <Mobile handleToDate={handleToDate} handleFromDate={handleFromDate} />
      ) : (
        <Desktop handleToDate={handleToDate} handleFromDate={handleFromDate} />
      )}
    </>
  )
}

export default Filters
