// @flow

import React from 'react'
import { Route, Switch, withRouter } from 'react-router'
import Base from './Base'
import Thang from './Thang'
import ThangSelectMenu from './ThangSelectMenu'

export default withRouter(({match}: *) => (
  <div>
    <ThangSelectMenu />
    <div style={{paddingLeft: '16rem', paddingTop: '1rem'}}>
      <Switch>
        <Route path={`${match.path}`} exact component={Base} />
        <Route path={`${match.path}/:id`} component={Thang} />
      </Switch>
    </div>
  </div>
))
