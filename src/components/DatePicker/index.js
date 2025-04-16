import React, { useState, useRef, useContext } from 'react'
import { MdDateRange } from 'react-icons/md'
import { Context } from 'context/index'
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
  cursor: pointer;
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

const NativeDateInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`

const DatePicker = (props) => {
  const { title, onDayClick, ...rest } = props

  const { setShowFilters } = useContext(Context)

  const dateInputRef = useRef(null)

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value)
    onDayClick(selectedDate)
    setShowFilters(false)
  }

  const handleContainerClick = () => {
    dateInputRef.current.showPicker()
  }

  return (
    <Container>
      <InnerContainer onClick={handleContainerClick}>
        <Span>{title}:</Span>
        <Text>{moment(rest.selectedDays).format('DD-MM-YYYY')}</Text>
        <MdDateRange size={32} />
        <NativeDateInput
          type="date"
          ref={dateInputRef}
          onChange={handleDateChange}
          value={moment(rest.selectedDays).format('YYYY-MM-DD')}
        />
      </InnerContainer>
    </Container>
  )
}

export default DatePicker
