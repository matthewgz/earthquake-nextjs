import React, { useContext } from 'react'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { Context } from 'context/index'

import styled from 'styled-components'

const Container = styled.div`
  background: rgba(73, 91, 115, 0.5);
  border-radius: 0px 8px 8px 0px;
  height: 40px;
  position: absolute;
  right: -31px;
  top: 24px;
  width: 32px;
  z-index: 100;
  cursor: pointer;
`

const Arrow = styled(MdKeyboardArrowRight)`
  position: absolute;
  right: ${(props) => `${props.right}px`};
`

const Ribbon = () => {
  const { showResults, setShowResults } = useContext(Context)

  const handleOnClick = () => {
    setShowResults(!showResults)
  }

  return (
    <Container onClick={handleOnClick}>
      <Arrow size={40} right={-8} />
      <Arrow size={40} right={0} />
    </Container>
  )
}

export default Ribbon
