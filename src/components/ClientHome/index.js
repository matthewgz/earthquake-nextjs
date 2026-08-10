'use client'

import { useReducer, useContext, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import isEqual from 'lodash.isequal'
import styled from 'styled-components'

import Helmet from '../Helmet'
import Header from '../Header'
import Results from '../Results'
import { Context } from '../../context/index'
import { PER_PAGE, TYPES } from '../../utils/constants'
import { buildQuery, getQueryUrl } from '../../utils/usgsApi'

const EarthquakeMap = dynamic(() => import('../EarthquakeMap'), { ssr: false })

const Container = styled.div`
  position: relative;
  height: 100dvh;

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
async function getServerData(query) {
  const res = await fetch(getQueryUrl(query))
  const data = await res.json()
  return data?.features || []
}

export default function ClientHome({ initialData, initialQuery }) {
  const { minMagnitude, range } = useContext(Context)
  const [state, dispatch] = useReducer(reducer, getInitialState(initialData))

  // Sustituye a la antigua guardia `firstUpdate`, que suprimía la
  // reconciliación para siempre: si el "hoy" del servidor no coincidía con el
  // del navegador, la discrepancia no se corregía nunca. Comparar la consulta
  // derivada con la que ya trajo el servidor permite exactamente una petición
  // correctiva, y ninguna cuando ambos coinciden.
  const lastQuery = useRef(initialQuery)

  const load = () => {
    dispatch({ type: TYPES.start })

    setTimeout(() => {
      const newData = state.allData.slice(state.after, state.after + PER_PAGE)
      dispatch({ type: TYPES.loaded, newData, allData: state.allData })
    }, 300)
  }

  useEffect(() => {
    const query = buildQuery({
      minMagnitude,
      start: range.start,
      end: range.end,
    })

    // `null` = rango aún sin inicializar (pre-hidratación) o inválido.
    if (!query || query === lastQuery.current) {
      return
    }

    lastQuery.current = query

    async function fetchFilteredData() {
      dispatch({ type: TYPES.start })
      const data = await getServerData(query)
      dispatch({ type: TYPES.more, allData: data })
    }

    fetchFilteredData()
  }, [minMagnitude, range.start, range.end])

  useEffect(() => {
    if (isEqual(state.allData, initialData)) {
      return
    }

    dispatch({ type: TYPES.reset, allData: state.allData })
  }, [state.allData, initialData])

  if (!state || state.length === 0) {
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
        <EarthquakeMap isMarkerShown data={state.allData} />
      </main>
    </Container>
  )
}
