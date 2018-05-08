// @flow
import React from 'react'
import { Query, type QueryRenderProps } from 'react-apollo'
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
import GET_ME from '../../graphql/getMe.graphql'
import type { getMeQuery } from '../../graphql'

addLocaleData(englishLocaleData)

type User = {
  id: string,
  picture: string,
  displayName: string
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
        <SecondaryMenuOverlay open={this.state.open}>
          <Button href={'/auth/logout'} fluid color={'red'}>
            <LogOut />
            <FormattedMessage id={'logout'} />
          </Button>
        </SecondaryMenuOverlay>
        <ThangSelectMenu />
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
      {({loading, error, data}: QueryRenderProps<getMeQuery, {}>) => {
        if (loading) {
          return <Logo loading /> // TODO fix humongous loading
        }
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
