import React, { useContext, useRef } from 'react'
import Image from 'next/image'
import { FaFilter } from 'react-icons/fa'
import { Context } from 'context/index'
import Filters from 'components/Filters'
import useOutsideAlerter from 'hooks/useOutsideAlerter'
import { isUndefined } from 'lodash'

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

const Filter = styled(FaFilter)`
  cursor: pointer;
`

const Header = () => {
  const { showFilters, setShowFilters, isMobile } = useContext(Context)

  const ref = useRef(null)

  useOutsideAlerter(ref, setShowFilters)

  const handleOnClick = () => {
    setShowFilters(!showFilters)
  }

  return (
    <div ref={ref}>
      <InnerContainer>
        <Image
          src="/logo.png"
          alt="Logo"
          width={152}
          height={35}
          priority={true}
        />
        {isMobile === true || isUndefined(isMobile) ? (
          <Filter
            size={24}
            color={showFilters ? '#495B73' : '#93AEBF'}
            onClick={handleOnClick}
          />
        ) : (
          <Filters />
        )}
      </InnerContainer>
      {isMobile && <Filters />}
    </div>
  )
}

export default Header
