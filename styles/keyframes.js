import { keyframes } from 'styled-components'

export const move = (props) => keyframes`
  from {
    ${props.ini?.top && `top: ${props.ini?.top}`};
    ${props.ini?.right && `right: ${props.ini?.right}`};
    ${props.ini?.left && `left: ${props.ini?.left}`};
    ${props.ini?.bottom && `bottom: ${props.ini?.bottom}`};
  }
  to {
    ${props.fin?.top && `top: ${props.fin?.top}`};
    ${props.fin?.right && `right: ${props.fin?.right}`};
    ${props.fin?.left && `left: ${props.fin?.left}`};
    ${props.fin?.bottom && `bottom: ${props.fin?.bottom}`};
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
