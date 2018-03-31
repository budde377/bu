// @flow

import ApolloClient from 'apollo-client/index'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'
import { WebSocketLink } from 'apollo-link-ws'
import { split } from 'apollo-link/lib/index'
import { getMainDefinition } from 'apollo-utilities'
import { authResult } from '../auth'

const res = authResult()

function customFetch (uri, options) {
  const r = authResult()
  if (r) {
    options.headers.authentication = `Bearer ${r.token}`
  }
  return fetch(uri, options)
}

const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
  fetch: customFetch
})

const wsLink = new WebSocketLink({
  uri: 'ws://localhost:3000/subscriptions',
  options: {
    reconnect: true,
    connectionParams: {
      authToken: res && res.token
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
  cache: new InMemoryCache()
})

export default client
