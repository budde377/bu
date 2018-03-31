// @flow

import { ApolloProvider } from 'react-apollo'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import React from 'react'
import { hot } from 'react-hot-loader'
import client from '../graphql/client'
import { addLocaleData, IntlProvider } from 'react-intl'
import englishLocaleData from 'react-intl/locale-data/en'
import messages from '../../locale/en.json'

addLocaleData(englishLocaleData)

export default hot(module)(() => (
  <ApolloProvider client={client}>
    <IntlProvider locale={'en'} messages={messages}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </IntlProvider>
  </ApolloProvider>
))
