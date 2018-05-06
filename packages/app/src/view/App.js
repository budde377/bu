// @flow
import React from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import { Redirect, Route, Switch } from 'react-router'
import Thang from './thang'
import { addLocaleData, FormattedMessage, IntlProvider } from 'react-intl'
import englishLocaleData from 'react-intl/locale-data/en'
import messages from '../../locale/en.json'
import { hot } from 'react-hot-loader'
import NotFoundApp from './NotFoundApp'
import Logo from './Logo'
import PublicApp from './PublicApp'
import {
  BaseContainer,
  LogoLink,
  Menu,
  MenuContainer,
  ContentContainer,
  AvatarContainer, SecondaryMenuOverlay
} from './styled/Menu'
import { Avatar } from './styled/User'
import { Helmet } from 'react-helmet'
import ThangSelectMenu from './ThangSelectMenu'
import { A as Button } from './styled/Button'
import { LogOut } from './styled/Icon'

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

class SecondaryMenu extends React.Component<{ user: User }, { open: boolean }> {
  state = {
    open: false
  }
  _toggleUserMenu = () => this.setState(({open}) => ({open: !open}))

  render () {
    return (
      <MenuContainer>
        <AvatarContainer backgroundImage={this.props.user.picture} onClick={this._toggleUserMenu}>
          <Avatar picture={this.props.user.picture} />
        </AvatarContainer>
        <ThangSelectMenu />
        <SecondaryMenuOverlay open={this.state.open}>
          <Button href={'/auth/logout'} fluid color={'red'}>
            <LogOut />
            <FormattedMessage id={'logout'} />
          </Button>
        </SecondaryMenuOverlay>
      </MenuContainer>
    )
  }
}

const LoggedInApp = ({user}: { user: User }) => (
  <BaseContainer>
    <Helmet>
      <title>Thang</title>
    </Helmet>
    <ContentContainer>
      <Menu>
        <LogoLink to={'/'}>
          <img src={require('../../images/logo_named.svg')} />
        </LogoLink>
      </Menu>
      <Switch>
        <Route path={'/thangs'} component={Thang} />
        <Redirect from={'/'} to={'/thangs'} exact />
        <Route component={NotFoundApp} />
      </Switch>
    </ContentContainer>
    <SecondaryMenu user={user} />
  </BaseContainer>
)

const App = () => (
  <IntlProvider locale={'en'} messages={messages}>
    <Query query={GET_ME}>
      {({loading, error, data}) => {
        if (loading) {
          return <Logo loading /> // TODO fix humongous loading
        }
        // $FlowFixMe Update types
        const me: ?User = data && data.me ? data.me : null
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
