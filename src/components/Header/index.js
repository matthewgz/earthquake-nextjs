import React, { useContext, useId, useRef } from 'react'
import Image from 'next/image'
import { FaFilter } from 'react-icons/fa'
import { Context } from 'context/index'
import Filters from 'components/Filters'
import useOutsideAlerter from 'hooks/useOutsideAlerter'

import styled from 'styled-components'

const InnerContainer = styled.nav`
  align-items: center;
  display: flex;
  height: 60px;
  justify-content: space-between;
  padding: 0 16px;
  position: relative;
  z-index: 1000;
  background-color: #111426;
`

const FilterButton = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${(props) => (props.$active ? '#495B73' : '#93AEBF')};
  cursor: pointer;
  display: flex;
  padding: 8px;

  &:focus-visible {
    outline: 2px solid #93aebf;
    outline-offset: 2px;
  }
`

// Título accesible de la página: la marca solo existe como imagen, así que sin
// esto el documento no tenía ningún encabezado de primer nivel.
const VisuallyHiddenTitle = styled.h1`
  border: 0;
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`

const Header = () => {
  const { showFilters, setShowFilters, isMobile } = useContext(Context)

  const ref = useRef(null)
  const panelId = useId()

  useOutsideAlerter(ref, setShowFilters)

  const handleOnClick = () => {
    setShowFilters(!showFilters)
  }

  return (
    <div ref={ref}>
      <VisuallyHiddenTitle>
        Earthquake — visor de sismos en el mundo
      </VisuallyHiddenTitle>
      <InnerContainer>
        <Image
          src="/logo.png"
          alt="Earthquake"
          width={152}
          height={35}
          priority
        />
        {isMobile ? (
          // Era un `<svg onClick>`: sin semántica de botón, sin foco y sin
          // indicar si el panel estaba abierto.
          <FilterButton
            type="button"
            $active={showFilters}
            onClick={handleOnClick}
            aria-expanded={showFilters}
            aria-controls={panelId}
            aria-label="Filtros"
          >
            <FaFilter size={24} aria-hidden="true" />
          </FilterButton>
        ) : (
          <Filters />
        )}
      </InnerContainer>
      {isMobile && (
        <div id={panelId}>
          <Filters />
        </div>
      )}
    </div>
  )
}

export default Header
