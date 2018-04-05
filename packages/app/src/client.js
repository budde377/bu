// @flow
import React from 'react'
import ReactDOM from 'react-dom'
import App from './view/App'
import { ApolloProvider } from 'react-apollo'
import { BrowserRouter } from 'react-router-dom'
import client from './graphql/client'
import { hot } from 'react-hot-loader'
import 'semantic-ui-css/semantic.min.css'

const root = window.document.getElementById('content')

const HotApp = hot(module)(() => <App />)

ReactDOM.hydrate(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <HotApp />
    </BrowserRouter>
  </ApolloProvider>,
  root
)
