import React, { forwardRef, useContext } from 'react'
import moment from 'moment'

import styled from 'styled-components'
import { Context } from 'context/index'

const Tooltip = styled.div`
  margin: 0;
  padding: 5px;
  border-radius: 10px;
  width: auto;
  visibility: hidden;
  background-color: lightgrey;
  opacity: 0;
  transition: opacity 0.5s ease;
  font-size: 10px;
  position: absolute;
  top: -24px;
  left: 0;
  z-index: 100;

  &:hover {
    transition: opacity 0.5s ease;
    opacity: 1;
    visibility: visible;
  }
`

const Title = styled.div`
  display: flex;
  align-items: center;
  position: relative;

  h4 {
    margin: 0;
    padding: 0;
    max-width: 168px;
    white-space: nowrap;
    overflow: hidden;
    position: relative;
    font-size: 18px;
    font-weight: bold;
    text-overflow: ellipsis;

    &:hover + ${Tooltip} {
      transition: opacity 0.5s ease;
      opacity: 1;
      visibility: visible;
    }
  }
`

const Label = styled.div`
  align-items: center;
  background: #93aebf;
  border-radius: 8px;
  display: flex;
  font-size: 18px;
  font-weight: bold;
  height: 24px;
  justify-content: center;
  position: absolute;
  width: 40px;
  right: 0;
`

const Text = styled.p`
  font-size: 14px;
  margin-top: 8px;

  & span {
    font-weight: 500;
    width: 46px;
    display: inline-block;
  }
`

const Container = styled.div`
  background-color: #7b92a6;
  border-radius: 4px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  height: 101px;
  padding: 16px;
  user-select: none;
  width: 253px;
  box-sizing: border-box;

  ${(props) => props.cursor && `cursor: pointer`};
  ${(props) =>
    props.list && props.id === props.currentId && `border: 2px white solid`};
`

const Card = forwardRef((props, ref) => {
  const { properties, ...rest } = props
  const { marker } = useContext(Context)

  return (
    <Container ref={ref} {...rest} currentId={marker?.id}>
      <Title>
        <h4>{properties.place}</h4>
        <Tooltip>{properties.place}</Tooltip>
        <Label>{properties.mag.toFixed(1)}</Label>
      </Title>
      <Text>
        <span>Fecha: </span>
        {moment(properties.time).format('DD/MM/YYYY')}
      </Text>
      <Text>
        <span>Hora: </span>
        {moment(properties.time).format('LT')}
      </Text>
    </Container>
  )
})

export default Card
