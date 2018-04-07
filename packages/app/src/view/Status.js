// @flow
import React from 'react'
import { Route } from 'react-router'

export default (props: {statusCode: number}) => (
  <Route
    render={({ staticContext }) => {
      // we have to check if staticContext exists
      // because it will be undefined if rendered through a BrowserRouter
      if (staticContext) {
        staticContext.statusCode = props.statusCode
      }
      return null
    }}
  />
)
