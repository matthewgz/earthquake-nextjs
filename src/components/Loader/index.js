import React from 'react'
import { rotate } from 'styles/keyframes'

import styled from 'styled-components'

const Div = styled.div`
  width: 40px;
  height: 40px;
  border: 10px solid #eee;
  border-top: 10px solid #666;
  border-radius: 50%;
  animation-name: ${rotate};
  animation-duration: 2s;
  animation-iteration-count: infinite;
`

const Container = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  margin-top: 24px;

  ${(props) => props.fullHeight && `height: 100%`};
`

const Loader = (props) => {
  return (
    <Container {...props}>
      <Div />
    </Container>
  )
}

export default Loader
