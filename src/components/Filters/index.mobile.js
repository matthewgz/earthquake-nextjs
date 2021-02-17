import React, { useState, useEffect, useContext, useRef } from 'react'
import Select from 'components/Select'
import DatePicker from 'components/DatePicker'
import { move } from 'styles/keyframes'
import { isNull } from 'lodash'
import { Context } from 'context/index'

import styled from 'styled-components'

const Container = styled.div`
  background: linear-gradient(
    180deg,
    #495b73 0%,
    rgba(73, 91, 115, 0) 200.24%,
    #93aebf 200.24%
  );
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  padding: 24px 16px;
  z-index: 900;
  position: absolute;

  animation: ${(props) => move(props)} ease-out 1s;
  ${(props) => !isNull(props.fin?.right) && `right: ${props.fin?.right}`};
  ${(props) => !isNull(props.fin?.left) && `left: ${props.fin?.left}`};
  ${(props) => !isNull(props.fin?.top) && `top: ${props.fin?.top}`};
  ${(props) => !isNull(props.fin?.bottom) && `bottom: ${props.fin?.bottom}`};
`

const show = {
  ini: {
    right: '0px',
    left: '0px',
    top: '-190px',
  },
  fin: {
    right: '0px',
    left: '0px',
    top: '60px',
  },
}

const hide = {
  fin: {
    right: '0px',
    left: '0px',
    top: '-190px',
  },
  ini: {
    right: '0px',
    left: '0px',
    top: '60px',
  },
}

const FiltersMobile = (props) => {
  const { handleToDate, handleFromDate } = props

  const { showFilters, dates } = useContext(Context)

  const firstUpdate = useRef(true)

  const [animation, setAnimation] = useState({
    fin: showFilters ? show.fin : hide.fin,
  })

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false

      return
    }

    setAnimation(showFilters ? show : hide)
  }, [showFilters])

  return (
    <Container {...animation}>
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

export default FiltersMobile
