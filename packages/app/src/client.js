// @flow
import React from 'react'
import ReactDOM from 'react-dom'
import App from './view/App'
import { ApolloProvider } from 'react-apollo'
import { BrowserRouter } from 'react-router-dom'
import client from './graphql/client'
import 'semantic-ui-css/semantic.min.css'

const root = window.document.getElementById('content')

ReactDOM.hydrate(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ApolloProvider>,
  root
)
