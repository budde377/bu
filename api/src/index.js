// @flow
import koa from 'koa'
import koaRouter from 'koa-router'
import koaBody from 'koa-bodyparser'
import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa'
import config from 'config'
import schema from './graphql/schema'
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';

const app = new koa();
const router = new koaRouter();

app.use(koaBody());
const currentUser = 'f01048cf-d12b-44cd-8840-76065678eebf'

router.post('/graphql', graphqlKoa({ schema, context: { currentUser }}));
router.get('/graphql', graphqlKoa({ schema }));

// Setup the /graphiql route to show the GraphiQL UI
router.get(
  '/graphiql',
  graphiqlKoa({
    endpointURL: '/graphql',
    subscriptionsEndpoint: `ws://localhost:3000/subscriptions`
  })
)


app.use(router.routes());
app.use(router.allowedMethods());
const server = app.listen(config.port)

new SubscriptionServer({
  execute,
  subscribe,
  schema
}, {
  path: '/subscriptions',
  server,
});
