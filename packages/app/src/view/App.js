// @flow
import React from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import { Redirect, Route, Switch } from 'react-router'
import Thang from './thang'
import { addLocaleData, IntlProvider } from 'react-intl'
import englishLocaleData from 'react-intl/locale-data/en'
import messages from '../../locale/en.json'
import { hot } from 'react-hot-loader'
import NotFoundApp from './NotFoundApp'
import Logo from './Logo'
import PublicApp from './PublicApp'
import { AvatarContainer, BaseContainer, LogoLink, Menu, NotAvatarContainer } from './styled/Menu'
import { Avatar } from './styled/User'

addLocaleData(englishLocaleData)

const GET_ME = gql`
    query {
        me {
            id
            picture
            displayName
            emailVerified
        }
    }
`

type User = {
  id: string,
  picture: string,
  displayName: string,
  emailVerified: boolean
}

const LoggedInMenu = ({user}: { user: User }) => (
  <Menu>
    <NotAvatarContainer>
      <LogoLink to={'/'}>
        <img src={require('../../images/logo_named.svg')} />
      </LogoLink>
    </NotAvatarContainer>
    <AvatarContainer backgroundImage={user.picture}>
      <Avatar picture={user.picture} />
    </AvatarContainer>
  </Menu>
)

const LoggedInApp = ({user}: { user: User }) => (
  <BaseContainer>
    <LoggedInMenu user={user} />
    <Switch>
      <Route path={'/thangs'} component={Thang} />
      <Redirect from={'/'} to={'/thangs'} exact />
      <Route component={NotFoundApp} />
    </Switch>
  </BaseContainer>
)

const App = () => (
  <IntlProvider locale={'en'} messages={messages}>
    <Query query={GET_ME}>
      {({loading, error, data}) => {
        if (loading) {
          return <Logo loading /> // TODO fix humongous loading
        }
        const me: ?User = data.me
        if (!me) {
          return (
            <PublicApp />
          )
        }
        return <LoggedInApp user={me} />
      }}
    </Query>
  </IntlProvider>
)

export default hot(module)(() => <App />)
