// @flow
import React from 'react'
import ReactDOM from 'react-dom'
import App from './view'

function buildRoot () {
  const r = window.document.getElementById('root')
  if (r) {
    return r
  }
  const e = window.document.createElement('div')
  e.id = 'root'
  window.document.body.appendChild(e)
  return e
}

const root = buildRoot()

ReactDOM.render(
  <App />,
  root
)
