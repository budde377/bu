// @flow
import gql from 'graphql-tag'
import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Query } from 'react-apollo'
import { MenuLink, Empty, Item, Items, SecondaryMenu } from '../styled/Menu'
import { H1 } from '../styled/Header'
import { Button } from '../styled/Button'
import { Add } from '../styled/Icon'
import Modal from '../Modal'
import type { ContextRouter } from 'react-router'

import CreateThang from './CreateThang'
import { withRouter } from 'react-router'

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
          <Items>
            {this.props.thangs.map(({id, name}) => (
              <Item key={id}>
                <MenuLink to={`/thangs/${id}`}>
                  {name}
                </MenuLink>
              </Item>
            ))}
          </Items>)
        : (
          <Empty>
            <FormattedMessage id={'listThangs.empty'} />
          </Empty>
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

class AddThang extends React.Component<ContextRouter, { open: boolean }> {
  state = {open: false}

  _onCreate = (id: string) => {
    this.setState({open: false})
    this.props.history.push(`/thangs/${id}`)
  }
  _open = () => this.setState({open: true})
  _close = () => this.setState({open: false})

  render () {
    return (
      <div>
        <Button fluid color={'teal'} onClick={this._open}>
          <Add />
          <FormattedMessage id={'createThang'} />
        </Button>
        <Modal onClose={this._close} show={this.state.open}>
          <H1>
            <FormattedMessage id={'createThang'} />
          </H1>
          <p>
            <FormattedMessage id={'AddThang.message'} />
          </p>
          <CreateThang onCreate={this._onCreate} />
        </Modal>
      </div>
    )
  }
}

const AddThangRouted = withRouter(AddThang)

export default () => (
  <SecondaryMenu>
    <H1>
      <FormattedMessage id={'listThangs.your'} />
    </H1>
    <ListThangs />
    <AddThangRouted />
    <p>
      <FormattedMessage id={'createThang.desc'} />
    </p>
  </SecondaryMenu>
)
