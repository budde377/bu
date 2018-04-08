// @flow
import React from 'react'
import ReactDOM from 'react-dom'
import App from './view/App'
import { ApolloProvider } from 'react-apollo'
import { BrowserRouter } from 'react-router-dom'
import client from './graphql/client'

const root = window.document.getElementById('content')

ReactDOM.hydrate(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ApolloProvider>,
  root
)
