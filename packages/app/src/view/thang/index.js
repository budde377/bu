// @flow

import React from 'react'
import { Route, Switch, withRouter } from 'react-router'
import Base from './Base'
import Thang from './Thang'
import ThangSelectMenu from './ThangSelectMenu'
import { Content, SecondaryContent } from '../styled/Menu'

export default withRouter(({match}: *) => (
  <Content>
    <SecondaryContent>
      <Switch>
        <Route path={`${match.path}`} exact component={Base} />
        <Route path={`${match.path}/:id`} component={Thang} />
      </Switch>
    </SecondaryContent>
    <ThangSelectMenu />
    <div style={{clear: 'both'}} />
  </Content>
))
