'use client'

import { useReducer, useContext, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Helmet from '../Helmet'
import Header from '../Header'
import Results from '../Results'
import { Context } from '../../context/index'
import { PER_PAGE, TYPES } from '../../utils/constants'
import getUrlAPI from '../../utils/getUrlAPI'
import isEqual from 'lodash.isequal'
import styled from 'styled-components'

// Importar GoogleMaps dinámicamente sin SSR
const GoogleMaps = dynamic(
  () => import('../GoogleMaps'),
  { ssr: false }, // Deshabilita la renderización del servidor
)

const Container = styled.div`
  position: relative;
  height: 100vh;

  & main {
    position: absolute;
    top: 60px;
    bottom: 0;
    right: 0;
    left: 0;
  }
`

const getInitialState = (data) => ({
  allData: data,
  loading: false,
  more: data.length >= PER_PAGE,
  data: data.slice(0, PER_PAGE),
  total: data.length,
  after: 10,
  error: undefined,
})

const reducer = (state, action) => {
  switch (action.type) {
    case TYPES.start:
      return { ...state, loading: true }

    case TYPES.loaded:
      return {
        ...state,
        loading: false,
        data: [...state.data, ...action.newData],
        more: action.newData.length === PER_PAGE,
        after: state.after + action.newData.length,
        total: action.allData.length,
        allData: action.allData,
      }

    case TYPES.more:
      return {
        ...state,
        more: true,
        allData: action.allData,
        total: action.allData.length,
      }

    case TYPES.reset:
      return getInitialState(action.allData)

    default:
      throw new Error("Don't understand action")
  }
}

// Función para cargar datos en el cliente
async function getServerData(dates, minMagnitude) {
  const URL = getUrlAPI(dates, minMagnitude)
  const res = await fetch(URL)
  const data = await res.json()
  return data?.features || []
}

export default function ClientHome({ initialData }) {
  const firstUpdate = useRef(true)
  const { minMagnitude, dates } = useContext(Context)
  const [state, dispatch] = useReducer(reducer, getInitialState(initialData))

  const load = () => {
    dispatch({ type: TYPES.start })

    setTimeout(() => {
      const newData = state.allData.slice(state.after, state.after + PER_PAGE)
      dispatch({ type: TYPES.loaded, newData, allData: state.allData })
    }, 300)
  }

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false
      return
    }

    async function fetchFilteredData() {
      dispatch({ type: TYPES.start })
      const data = await getServerData(dates, minMagnitude)
      dispatch({ type: TYPES.more, allData: data })
    }

    fetchFilteredData()
  }, [minMagnitude, dates])

  useEffect(() => {
    if (isEqual(state.allData, initialData)) {
      return
    }

    dispatch({ type: TYPES.reset, allData: state.allData })
  }, [state.allData, initialData])

  if (!initialData || initialData.length === 0) {
    return (
      <Container>
        <Header />
        <main
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          Cargando...
        </main>
      </Container>
    )
  }

  return (
    <Container>
      <Helmet title="Earthquake" />
      <Header />
      <main>
        <Results {...state} load={load} />
        <GoogleMaps isMarkerShown data={state.allData} />
      </main>
    </Container>
  )
}
