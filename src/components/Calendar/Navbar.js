import React from 'react'
import { ImArrowRight, ImArrowLeft } from 'react-icons/im'

import styled from 'styled-components'

const Container = styled.div`
  position: absolute;
  right: 16px;
  top: 16px;

  & button {
    background-color: white;
    border: none;
    height: 24px;
    margin-left: 4px;
    width: 24px;
  }
`

const Navbar = ({ onPreviousClick, onNextClick }) => {
  return (
    <Container>
      <button onClick={() => onPreviousClick()}>
        <ImArrowLeft size={16} />
      </button>
      <button onClick={() => onNextClick()}>
        <ImArrowRight size={16} />
      </button>
    </Container>
  )
}

export default Navbar
