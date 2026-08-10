import React, { useContext } from 'react'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { Context } from 'context/index'

import styled from 'styled-components'

const InnerContainer = styled.span`
  position: absolute;
  inset: 0;
  transform: ${(props) =>
    props.$showResults ? 'rotate(180deg)' : 'rotate(0deg)'};
`

const Container = styled.button`
  background: rgba(73, 91, 115, 0.5);
  border: none;
  border-radius: 0px 8px 8px 0px;
  height: 40px;
  padding: 0;
  position: absolute;
  right: -31px;
  top: 24px;
  width: 32px;
  z-index: 100;
  cursor: pointer;
  color: inherit;

  &:focus-visible {
    outline: 2px solid #e5edef;
    outline-offset: 2px;
  }
`

const Arrow = styled(MdKeyboardArrowRight)`
  position: absolute;
  right: ${(props) => `${props.$right}px`};
`

const Ribbon = () => {
  const { showResults, setShowResults } = useContext(Context)

  const handleOnClick = () => {
    setShowResults(!showResults)
  }

  return (
    // Era un `div` con onClick: ni enfocable ni operable con teclado, y sin
    // nombre accesible que dijera qué hace.
    <Container
      type="button"
      onClick={handleOnClick}
      aria-expanded={showResults}
      aria-label={showResults ? 'Ocultar resultados' : 'Mostrar resultados'}
    >
      <InnerContainer $showResults={showResults} aria-hidden="true">
        <Arrow size={40} $right={-8} />
        <Arrow size={40} $right={0} />
      </InnerContainer>
    </Container>
  )
}

export default Ribbon
