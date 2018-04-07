// @flow
import React from 'react'

type Colors = [[bool, bool, bool], [bool, bool, bool], [bool, bool, bool]]

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

type LogoState = { currentColors: Colors, step: number }
type LogoProps = { loading?: boolean }

class Logo extends React.Component<LogoProps, LogoState> {
  state: LogoState
  _time = 100
  _style = {
    transition: '0.5s fill'
  }
  _interval: ?IntervalID
  _c1 = '#FA4659'
  _c2 = '#11CBD7'

  constructor (props: *) {
    super(props)
    this.state = this._initState(props)
  }

  _initState (props: LogoProps = this.props) {
    return props.loading
      ? {currentColors: steps[0], step: 0}
      : {currentColors: symbol, step: -1}
  }

  _updateColors () {
    this.setState(({step}) => step < 0
      ? {}
      : ({
        step: (step + 1) % steps.length,
        currentColors: steps[(step + 1) % steps.length]
      }))
  }

  _start (props: LogoProps) {
    if (this._interval) {
      clearInterval(this._interval)
    }
    if (props.loading) {
      this._interval = setInterval(() => this._updateColors(), this._time)
    }
  }

  componentDidMount () {
    this._start(this.props)
  }

  componentWillReceiveProps (props: LogoProps) {
    if ((props.loading && this.props.loading) || (!props.loading && !this.props.loading)) {
      return
    }
    this.setState(this._initState(props))
    this._start(props)
  }

  componentWillUnmount () {
    if (this._interval) {
      clearInterval(this._interval)
    }
  }

  render () {
    return (
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 2000' style={{height: '100%', width: '100%'}}>
        <circle
          cx='205.8' cy='205.8' r='205.8'
          style={{...this._style, fill: this.state.currentColors[0][0] ? this._c1 : this._c2}} />
        <circle
          cx='205.8' cy='955' r='205.8'
          style={{...this._style, fill: this.state.currentColors[1][0] ? this._c1 : this._c2}} />
        <circle
          cx='205.8' cy='1794.2' r='205.8'
          style={{...this._style, fill: this.state.currentColors[2][0] ? this._c1 : this._c2}} />
        <circle
          cx='1000' cy='205.8' r='205.8'
          style={{...this._style, fill: this.state.currentColors[0][1] ? this._c1 : this._c2}} />
        <circle
          cx='1000' cy='955' r='205.8'
          style={{...this._style, fill: this.state.currentColors[1][1] ? this._c1 : this._c2}} />
        <circle
          cx='1000' cy='1794.2' r='205.8'
          style={{...this._style, fill: this.state.currentColors[2][1] ? this._c1 : this._c2}} />
        <circle
          cx='1794.2' cy='205.8' r='205.8'
          style={{...this._style, fill: this.state.currentColors[0][2] ? this._c1 : this._c2}} />
        <circle
          cx='1794.2' cy='955' r='205.8'
          style={{...this._style, fill: this.state.currentColors[1][2] ? this._c1 : this._c2}} />
        <circle
          cx='1794.2' cy='1794.2' r='205.8'
          style={{...this._style, fill: this.state.currentColors[2][2] ? this._c1 : this._c2}} />
      </svg>
    )
  }
}

export default Logo
