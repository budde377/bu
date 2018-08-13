import styled from 'styled-components'

export default styled.button`
  background: ${({filled}) => filled ? '#FFBB02' : 'transparent'};
  border: 0.0625em solid ${({filled, inverted}) => filled ? 'transparent' : (inverted ? '#fff' : '#AE2370')};
  color: ${({inverted}) => inverted ? '#fff' : '#AE2370'};
  height: 3em;
  font-family: "Lato", sans-serif;
  text-align: center;
  font-weight: 400;
  font-size: 1em;
  white-space: nowrap;
  padding: 0 3em;
`