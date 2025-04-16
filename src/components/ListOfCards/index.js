import React, { useContext } from 'react'
import Card from 'components/Card'
import getLatLng from 'utils/getLatLng'
import { Context } from 'context/index'

import styled from 'styled-components'

const Container = styled.div`
  & > * {
    margin-bottom: 16px;
  }

  & :last-child {
    margin-bottom: 0;
  }
`

const ListOfCards = (props) => {
  const { data } = props

  const { setMarker } = useContext(Context)

  return (
    <Container>
      {data.map((item) => {
        return (
          <Card
            key={item.id}
            {...item}
            list="true"
            cursor={'true'}
            onClick={() => {
              setMarker((prev) => ({
                ...prev,
                id: item.id,
                position: getLatLng(item),
                zoom: 4,
              }))
            }}
          />
        )
      })}
    </Container>
  )
}

export default ListOfCards
