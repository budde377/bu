// @flow
import React from 'react'
import { Route } from 'react-router'

export default (props: {statusCode: number}) => (
  <Route
    render={({ staticContext }) => {
      if (staticContext) {
        // $FlowFixMe This happens
        staticContext.statusCode = props.statusCode
      }
      return null
    }}
  />
)
