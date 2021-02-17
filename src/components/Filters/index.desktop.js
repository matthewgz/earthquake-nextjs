import React, { useContext } from 'react'
import Select from 'components/Select'
import DatePicker from 'components/DatePicker'
import { Context } from 'context/index'

import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > * {
    width: 250px;
    padding: 0;
    margin: 0;
    margin-left: 16px;
  }
`

const FiltersDesktop = (props) => {
  const { handleToDate, handleFromDate } = props

  const { dates } = useContext(Context)

  return (
    <Container>
      <Select />
      <DatePicker
        title="Desde"
        onDayClick={handleToDate}
        selectedDays={new Date(dates.to)}
        disabledDays={[
          {
            after: new Date(),
          },
        ]}
      />
      <DatePicker
        title="Hasta"
        onDayClick={handleFromDate}
        selectedDays={new Date(dates.from)}
        disabledDays={[
          {
            before: new Date(dates.to),
            after: new Date(),
          },
        ]}
      />
    </Container>
  )
}

export default FiltersDesktop
