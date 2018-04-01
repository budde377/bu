// @flow

import React from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import 'semantic-ui-css/semantic.min.css'
import LoginButton from './auth/LoginButton'
import { Redirect, Route, Switch } from 'react-router'
import PopupApp from './popup'
import { Link, NavLink } from 'react-router-dom'
import { Container, Dropdown, Image, Menu } from 'semantic-ui-react'
import { logout } from '../auth'
import CreateThang from './CreateThang'
import Thang from './thang'
import { FormattedMessage } from 'react-intl'

const GET_ME = gql`
    query {
        me {
            id
            picture
            givenName
            name
        }
    }
`

class LoginMenu extends React.Component<{}> {
  _logout = () => logout()

  render () {
    return (
      <Query query={GET_ME}>
        {({loading, error, data}) => {
          if (loading) {
            return null
          }
          const me = data.me
          if (!me) {
            return (
              <Menu.Item>
                <LoginButton />
              </Menu.Item>
            )
          }
          return (
            <Dropdown item trigger={
              <div>
                <Image avatar src={me.picture} />
                <span style={{paddingLeft: '0.5em'}}>
                  {me.givenName || me.name}
                </span>
              </div>}>
              <Dropdown.Menu>
                <Dropdown.Item onClick={this._logout}>
                  <FormattedMessage id={'logout'} />
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )
        }}
      </Query>
    )
  }
}

const MainMenu = () => (
  <Menu stackable style={{minHeight: '4em'}}>
    <Menu.Item as={Link} to={'/'}>
      <Image style={{height: '2em'}} src={require('../../images/logo_icon.svg')} />
      <span style={{paddingLeft: '1em'}}>
        Thang.io
      </span>
    </Menu.Item>
    <Menu.Menu position={'right'}>
      <LoginMenu />
    </Menu.Menu>
  </Menu>
)

const GET_THANGS = gql`
    query getThangs {
        me {
            id
            thangs {
                id
                name
            }
        }
    }
`

const SUBSCRIBE_THANGS = gql`
    subscription subscribeThangs {
        myThangsChange {
            add {
                id
                name
            }
            remove {
                id
                name
            }
            change {
                id
                name
            }
        }
    }
`

class ThangList extends React.Component<{ subscribe: () => mixed, thangs: { id: string, name: string }[] }> {
  componentDidMount () {
    this.props.subscribe()
  }

  render () {
    return (
      this.props.thangs.length
        ? (
          <Menu.Menu>
            {this.props.thangs.map(({id, name}) => (
              <Menu.Item key={id} as={NavLink} to={`/thangs/${id}`}>
                {name}
              </Menu.Item>
            ))}
          </Menu.Menu>)
        : (
          <i>
            <FormattedMessage id={'listThangs.empty'} />
          </i>
        )
    )
  }
}

class ListThangs extends React.Component<{}> {
  render () {
    return (
      <Query query={GET_THANGS}>
        {({subscribeToMore, loading, error, data}) => {
          if (loading || !data.me) {
            return null
          }
          return (
            <ThangList thangs={data.me.thangs} subscribe={() => {
              subscribeToMore({
                document: SUBSCRIBE_THANGS,
                updateQuery: (prev, {subscriptionData}) => {
                  if (!subscriptionData.data) return prev
                  const {myThangsChange: {add, change, remove}} = subscriptionData.data
                  const oldThangs = prev.me.thangs
                  const tThangs1 = add
                    ? [...oldThangs, add]
                    : oldThangs
                  const tThangs2 = change
                    ? tThangs1.map((t) => t.id === change.id ? change : t)
                    : tThangs1
                  const thangs = remove
                    ? tThangs2.filter((t) => t.id !== remove.id)
                    : tThangs2
                  return {...prev, me: {...prev.me, thangs}}
                }
              })
            }} />
          )
        }}
      </Query>
    )
  }
}

const MainApp = () => (
  <Container fluid>
    <MainMenu />
    <Menu vertical secondary style={{position: 'absolute', left: 0, rigth: 0}}>
      <Menu.Item>
        <Menu.Header>
          <FormattedMessage id={'listThangs.your'} />
        </Menu.Header>
        <ListThangs />
      </Menu.Item>
      <Menu.Item>
        <CreateThang />
      </Menu.Item>
    </Menu>
    <div style={{paddingLeft: '16rem', paddingTop: '1rem'}}>
      <Thang />
    </div>
  </Container>
)

const App = () => (
  <Switch>
    <Route path={'/popup'} component={PopupApp} />
    <Route path={'/thangs'} component={MainApp} />
    <Redirect from={'/'} to={'/thangs'} />
  </Switch>
)

export default App
