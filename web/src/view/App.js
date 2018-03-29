// @flow

import React from "react";
import { render } from "react-dom";
import ApolloClient from "apollo-boost";
import gql from "graphql-tag";
import { split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

const httpLink = new HttpLink({
  uri: 'http://localhost:3000/graphql'
});

const wsLink = new WebSocketLink({
  uri: `ws://localhost:3000/subscriptions`,
  options: {
    reconnect: true
  }
});

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  uri: "http://localhost:3000/graphql",
  link
})

client
  .query({
    query: gql`
      {
        me {
          name
        }
      }
    `
  })
  .then(data => console.log({ data }));

import { ApolloProvider } from "react-apollo";

export default () => (
  <ApolloProvider client={client}>
    <div>
      <h2>My first Apollo app 🚀</h2>
    </div>
  </ApolloProvider>
);
