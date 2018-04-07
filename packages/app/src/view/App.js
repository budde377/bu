// @flow
import React from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import { Redirect, Route, Switch } from 'react-router'
import { Link } from 'react-router-dom'
import { Container, Image, Menu, Button } from 'semantic-ui-react'
import Thang from './thang'
import { addLocaleData, FormattedMessage, IntlProvider } from 'react-intl'
import englishLocaleData from 'react-intl/locale-data/en'
import messages from '../../locale/en.json'
import { hot } from 'react-hot-loader'
import NotFoundApp from './NotFoundApp'
import Loader from './LogoLoader'

addLocaleData(englishLocaleData)

const GET_ME = gql`
    query {
        me {
            id
            picture
            displayName
        }
    }
`

type User = {
  id: string,
  picture: string,
  displayName: string
}

const LoggedInMenu = ({user}: { user: User }) => (
  <Menu stackable style={{minHeight: '4em'}}>
    <Menu.Item as={Link} to={'/'}>
      <Image style={{height: '2em'}} src={require('../../images/logo_named.svg')} />
    </Menu.Item>
    <Menu.Menu position={'right'}>
      <Menu.Item>
        <Image avatar src={user.picture} />
        <span style={{paddingLeft: '0.5em'}}>{user.displayName}</span>
      </Menu.Item>
      <Menu.Item>
        <Button icon={'log out'} as={'a'} href={'/auth/logout'} />
      </Menu.Item>
    </Menu.Menu>
  </Menu>
)

const LoggedInApp = ({user}: { user: User }) => (
  <Container fluid>
    <LoggedInMenu user={user} />
    <Switch>
      <Route path={'/thangs'} component={Thang} />
      <Redirect from={'/'} to={'/thangs'} exact />
      <Route component={NotFoundApp} />
    </Switch>
  </Container>
)

const PublicApp = () => (
  <Container fluid>
    <Button as='a' href='/auth/login'>
      <FormattedMessage id={'login'} />
    </Button>
  </Container>
)

const App = () => (
  <IntlProvider locale={'en'} messages={messages}>
    <Query query={GET_ME}>
      {({loading, error, data}) => {
        if (loading) {
          return <Loader />
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
