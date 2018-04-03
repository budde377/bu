// @flow
import React from 'react'
import { Route, Switch, withRouter } from 'react-router'
import Login from './Login'
import Callback from './Callback'

const App = ({match}: *) => (
  <Switch>
    <Route path={`${match.path}/login`} component={Login} />
    <Route path={`${match.path}/callback`} component={Callback} />
  </Switch>
)

export default withRouter(App)
