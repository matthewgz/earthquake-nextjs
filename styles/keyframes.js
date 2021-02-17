import { keyframes } from 'styled-components'
import { isNull } from 'lodash'

export const move = (props) => keyframes`
  from {
    ${!isNull(props.ini?.top) && `top: ${props.ini?.top}`};
    ${!isNull(props.ini?.right) && `right: ${props.ini?.right}`};
    ${!isNull(props.ini?.left) && `left: ${props.ini?.left}`};
    ${!isNull(props.ini?.bottom) && `bottom: ${props.ini?.bottom}`};
  }
  to {
    
    ${!isNull(props.fin?.top) && `top: ${props.fin?.top}`};
    ${!isNull(props.fin?.right) && `right: ${props.fin?.right}`};
    ${!isNull(props.fin?.left) && `left: ${props.fin?.left}`};
    ${!isNull(props.fin?.bottom) && `bottom: ${props.fin?.bottom}`};
  }
`

export const rotate = keyframes`
from {
  transform: rotate(0deg);
}
to {
  transform: rotate(360deg);
}
`
