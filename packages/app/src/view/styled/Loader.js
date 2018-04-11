// @flow

import styled, { keyframes } from 'styled-components'

type Colors = [[bool, bool, bool], [bool, bool, bool], [bool, bool, bool]]

const c1 = '#FA4659'
const c2 = '#11CBD7'

const slidingSteps = [
  [
    [true, false, false],
    [false, false, false],
    [false, false, false]
  ],
  [
    [true, true, false],
    [true, false, false],
    [false, false, false]
  ],
  [
    [true, true, true],
    [true, true, false],
    [true, false, false]
  ],
  [
    [true, true, true],
    [true, true, true],
    [true, true, true]
  ],
  [
    [false, true, true],
    [true, true, true],
    [true, true, true]
  ],
  [
    [false, false, true],
    [false, true, true],
    [true, true, true]
  ],
  [
    [false, false, false],
    [false, false, true],
    [false, true, true]
  ],
  [
    [false, false, false],
    [false, false, false],
    [false, false, true]
  ],
  [
    [false, false, false],
    [false, false, false],
    [false, false, false]
  ]
]

const symbol = [
  [true, true, true],
  [false, true, false],
  [false, true, false]
]

function mask (c1: Colors): (c2: Colors) => Colors {
  return c2 => ([
    [c1[0][0] && c2[0][0], c1[0][1] && c2[0][1], c1[0][2] && c2[0][2]],
    [c1[1][0] && c2[0][0], c1[1][1] && c2[1][1], c1[1][2] && c2[1][2]],
    [c1[2][0] && c2[0][0], c1[2][1] && c2[2][1], c1[2][2] && c2[2][2]]
  ])
}

const steps = slidingSteps.map(mask(symbol))

function toKeyFrames (steps: Colors[]) {
  const kfSteps = steps.map((colors, t) => colors.map((row) => row.map((color) => `${t / (steps.length - 1) * 100}% {fill: ${color ? c1 : c2}}`)))
  const merged = kfSteps.reduce((acc, step) => step.map((row, r) => row.map((step, c) => `${acc[r][c]}${step} `)), [['', '', ''], ['', '', ''], ['', '', '']])
  return merged.map((row) => row.map((step) => keyframes`${step}`))
}

const keyFrames = toKeyFrames(steps)

export const Loader = styled.div`  
  circle {
    transition: 0.1s fill;
  }
  circle:nth-of-type(1) {
    ${({active}) => active ? `animation: 1s ${keyFrames[0][0]} infinite;` : `fill: ${symbol[0][0] ? c1 : c2}; `}
  }
  circle:nth-of-type(2) {
    ${({active}) => active ? `animation: 1s ${keyFrames[1][0]} infinite;` : `fill: ${symbol[1][0] ? c1 : c2}; `}
  }
  circle:nth-of-type(3) {
    ${({active}) => active ? `animation: 1s ${keyFrames[2][0]} infinite;` : `fill: ${symbol[2][0] ? c1 : c2}; `}
  }
  circle:nth-of-type(4) {
    ${({active}) => active ? `animation: 1s ${keyFrames[0][1]} infinite;` : `fill: ${symbol[0][1] ? c1 : c2}; `}
  }
  circle:nth-of-type(5) {
    ${({active}) => active ? `animation: 1s ${keyFrames[1][1]} infinite;` : `fill: ${symbol[1][1] ? c1 : c2}; `}
  }
  circle:nth-of-type(6) {
    ${({active}) => active ? `animation: 1s ${keyFrames[2][1]} infinite;` : `fill: ${symbol[2][1] ? c1 : c2}; `}
  }
  circle:nth-of-type(7) {
    ${({active}) => active ? `animation: 1s ${keyFrames[0][2]} infinite;` : `fill: ${symbol[0][2] ? c1 : c2}; `}
  }
  circle:nth-of-type(8) {
    ${({active}) => active ? `animation: 1s ${keyFrames[1][2]} infinite;` : `fill: ${symbol[1][2] ? c1 : c2}; `}
  }
  circle:nth-of-type(9) {
    ${({active}) => active ? `animation: 1s ${keyFrames[2][2]} infinite;` : `fill: ${symbol[2][2] ? c1 : c2}; `}
  }
`
