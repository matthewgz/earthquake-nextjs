import React, { Children, useContext } from 'react'
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
      {Children.toArray(
        data.map((item) => {
          return (
            <Card
              {...item}
              list={true}
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
        }),
      )}
    </Container>
  )
}

export default ListOfCards
