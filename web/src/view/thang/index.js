// @flow

import React from 'react'
import { Route, Switch, withRouter } from 'react-router'
import Base from './Base'
import Thang from './Thang'

export default withRouter(({match}: *) => (
  <Switch>
    <Route path={`${match.path}`} exact component={Base} />
    <Route path={`${match.path}/:id`} component={Thang} />
  </Switch>
))
