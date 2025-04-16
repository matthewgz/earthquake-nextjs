import React, { useState, useContext, useRef, Children } from 'react'
import { Context } from 'context/index'
import { IoIosArrowDown } from 'react-icons/io'
import useOutsideAlerter from 'hooks/useOutsideAlerter'

import styled from 'styled-components'

const Options = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  margin: 0;
  padding: 8px 16px;
  border-bottom: 1px groove white;

  &:hover {
    background: #495b73;
  }
`

const ListOfOptions = styled.div`
  border: 1px solid #e5edef;
  background: #7b92a6;
  max-height: 40vh;
  position: absolute;
  right: 0;
  left: 0;
  top: 64px;
  z-index: 800;
  overflow: auto;
`

const InnerContainer = styled.div`
  align-items: center;
  background: #7b92a6;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  display: flex;
  font-size: 18px;
  height: 56px;
  justify-content: space-between;
  padding: 0 16px;
`

const Container = styled.div`
  position: relative;
`

const Select = (props) => {
  const { className } = props

  const [show, setShow] = useState(false)

  const { setMinMagnitude, minMagnitude, setShowFilters } = useContext(Context)

  const ref = useRef(null)

  useOutsideAlerter(ref, setShow)

  const options = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, idx) => ({
    _id: idx,
    value: idx,
  }))

  const showValues = () => {
    setShow(!show)
  }

  const handleOnClickOption = (e) => {
    setMinMagnitude(e.value)

    setShow(false)

    setShowFilters(false)
  }

  const renderOptions = (e) => (
    <Options onClick={() => handleOnClickOption(e)} key={e._id}>
      <p>{e.value}</p>
    </Options>
  )

  return (
    <Container ref={ref} className={className}>
      <InnerContainer onClick={showValues}>
        <p>{minMagnitude ? minMagnitude : 'Magnitud'}</p>
        <IoIosArrowDown size={32} />
      </InnerContainer>
      {show && (
        <ListOfOptions>{options && options.map(renderOptions)}</ListOfOptions>
      )}
    </Container>
  )
}

export default Select
