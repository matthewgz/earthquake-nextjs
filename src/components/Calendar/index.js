import React from 'react'
import DayPicker from 'react-day-picker'
import Navbar from './Navbar'
import 'react-day-picker/lib/style.css'

import styled from 'styled-components'

const StyledDayPicker = styled(DayPicker)`
  & abbr {
    color: #93aebf;
  }
`

const Container = styled.div`
  position: absolute;
  background-color: #7b92a6;
  z-index: 1100;
  top: 64px;
  right: 0;
  left: 0;
  display: flex;
  justify-content: center;
`

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const WEEKDAYS_LONG = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
]
const WEEKDAYS_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

const Calendar = (props) => {
  const modifiers = {
    allDays: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    today: new Date(),
    disabled: props.disabledDays,
  }
  const modifiersStyles = {
    allDays: {
      color: '#B0CFE2',
    },
    today: {
      color: '#000',
      fontWeight: '900',
    },
    disabled: {
      backgroundColor: '#666',
    },
  }

  return (
    <Container>
      <StyledDayPicker
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        locale="es"
        months={MONTHS}
        weekdaysLong={WEEKDAYS_LONG}
        weekdaysShort={WEEKDAYS_SHORT}
        navbarElement={<Navbar />}
        {...props}
      />
    </Container>
  )
}

export default Calendar
