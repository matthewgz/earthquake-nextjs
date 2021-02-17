import React, { useState, useRef, useContext } from 'react'
import { MdDateRange } from 'react-icons/md'
import { Context } from 'context/index'
import Calendar from 'components/Calendar'
import useOutsideAlerter from 'hooks/useOutsideAlerter'
import moment from 'moment'

import styled from 'styled-components'

const InnerContainer = styled.div`
  align-items: center;
  background: #7b92a6;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  display: flex;
  font-size: 18px;
  height: 56px;
  justify-content: flex-end;
  padding: 0 16px;
  position: relative;
`

const Span = styled.span`
  font-size: 12px;
  left: 16px;
  position: absolute;
  top: 4px;
`

const Text = styled.p`
  bottom: 8px;
  left: 16px;
  position: absolute;
`

const Container = styled.div`
  position: relative;
  margin-top: 16px;
`

const DatePicker = (props) => {
  const { title, onDayClick, ...rest } = props

  const { setShowFilters } = useContext(Context)

  const [showCalendar, setShowCalendar] = useState(false)

  const ref = useRef(null)

  useOutsideAlerter(ref, setShowCalendar)

  const handleToggleCalendar = () => {
    setShowCalendar(!showCalendar)
  }

  return (
    <Container ref={ref}>
      <InnerContainer onClick={handleToggleCalendar}>
        <Span>{title}:</Span>
        <Text>{moment(rest.selectedDays).format('DD-MM-YYYY')}</Text>
        <MdDateRange size={32} />
      </InnerContainer>
      {showCalendar && (
        <Calendar
          onDayClick={(...props) => {
            onDayClick(...props)

            setShowCalendar(false)

            setShowFilters(false)
          }}
          {...rest}
        />
      )}
    </Container>
  )
}

export default DatePicker
