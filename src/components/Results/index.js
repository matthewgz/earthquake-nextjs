import React, { useState, useEffect, useContext, useRef } from 'react'
import Ribbon from 'components/Ribbon'
import ListOfCards from 'components/ListOfCards'
import Loader from 'components/Loader'
import { Context } from 'context/index'
import { move } from 'styles/keyframes'
import { useInView } from 'react-intersection-observer'

import styled from 'styled-components'

const InnerContainer = styled.div`
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
  padding: 16px;
  width: 100%;

  /* width */
  ::-webkit-scrollbar {
    width: 4px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  & > p {
    font-size: 14px;
    margin-bottom: 24px;
    text-align: center;
  }
`

const Container = styled.div`
  background: rgba(73, 91, 115, 0.9);
  border-radius: 0px 8px 8px 0px;
  position: absolute;
  width: 285px;
  z-index: 10000;

  animation: ${(props) => move(props)} ease-out 1s;
  ${(props) => props.$fin?.right && `right: ${props.$fin?.right}`};
  ${(props) => props.$fin?.left && `left: ${props.$fin?.left}`};
  ${(props) => props.$fin?.top && `top: ${props.$fin?.top}`};
  ${(props) => props.$fin?.bottom && `bottom: ${props.$fin?.bottom}`};
`

const show = {
  ini: {
    bottom: '0px',
    top: '0px',
    left: '-285px',
  },
  fin: {
    bottom: '0px',
    top: '0px',
    left: '0px',
  },
}

const hide = {
  fin: {
    bottom: '0px',
    top: '0px',
    left: '-285px',
  },
  ini: {
    bottom: '0px',
    top: '0px',
    left: '0px',
  },
}

const Results = (props) => {
  const { data, loading, more, load, total } = props

  const { showResults, isMobile, setShowResults } = useContext(Context)

  const [animation, setAnimation] = useState({
    fin: showResults ? show.fin : hide.fin,
  })

  const { ref, inView, entry } = useInView({
    threshold: 1,
  })

  const loader = useRef(load)

  const firstUpdate = useRef(true)

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false

      return
    }

    setAnimation(showResults ? show : hide)
  }, [showResults])

  useEffect(() => {
    if (entry?.isIntersecting) {
      loader.current()
    }
  }, [inView])

  useEffect(() => {
    loader.current = load
  }, [load])

  useEffect(() => {
    setShowResults(!isMobile)
  }, [isMobile])

  return (
    <Container $fin={animation.fin}>
      <InnerContainer>
        <Ribbon />
        <p>{total} resultados...</p>
        <ListOfCards data={data} />
        {loading && <Loader />}
        {!loading && more && <div ref={ref}></div>}
      </InnerContainer>
    </Container>
  )
}

export default Results
