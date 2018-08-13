import styled from 'styled-components'
import React from 'react'

const Icon = styled.svg``

export const Clock = styled((props) => (
  <Icon {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd">
    <path
      d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12-12-5.377-12-12 5.377-12 12-12zm0 1c6.071 0 11 4.929 11 11s-4.929 11-11 11-11-4.929-11-11 4.929-11 11-11zm0 11h6v1h-7v-9h1v8z" />
  </Icon>
))``

export const SpeachBubble = styled((props) => (
  <Icon {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd">
    <path
      d="M12 1c-6.338 0-12 4.226-12 10.007 0 2.05.739 4.063 2.047 5.625l-1.993 6.368 6.946-3c1.705.439 3.334.641 4.864.641 7.174 0 12.136-4.439 12.136-9.634 0-5.812-5.701-10.007-12-10.007m0 1c6.065 0 11 4.041 11 9.007 0 4.922-4.787 8.634-11.136 8.634-1.881 0-3.401-.299-4.946-.695l-5.258 2.271 1.505-4.808c-1.308-1.564-2.165-3.128-2.165-5.402 0-4.966 4.935-9.007 11-9.007" />
  </Icon>
))``

export default Icon
