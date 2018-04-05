// @flow

import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'
import { WebSocketLink } from 'apollo-link-ws'
import { split } from 'apollo-link'
import { getMainDefinition } from 'apollo-utilities'
import type {Config} from '../view/Html'

const config: Config = window.__CONFIG__

function customFetch (uri, options) {
  const r = ''
  if (r) {
    options.headers.authentication = `Bearer ${r.token}`
  }
  return fetch(uri, options)
}

const httpLink = createHttpLink({
  // $FlowFixMe: This is ok
  uri: `${config.api.http}/graphql`,
  fetch: customFetch
})

const wsLink = new WebSocketLink({
  uri: `${config.api.ws}/subscriptions`,
  options: {
    reconnect: true,
    connectionParams: {
      authToken: ''
    }
  }
})

const link = split(
  ({query}) => {
    const {kind, operation} = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  httpLink
)

const client = new ApolloClient({
  link,
  ssrForceFetchDelay: 100,
  cache: new InMemoryCache().restore(window.__APOLLO_STATE__)
})

export default client
