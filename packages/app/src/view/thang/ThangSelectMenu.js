// @flow
import gql from 'graphql-tag'
import React from 'react'
import { FormattedMessage } from 'react-intl'
import { NavLink } from 'react-router-dom'
import { Query } from 'react-apollo'
import { Empty, Header, Item, Items, SecondaryMenu } from '../styled/Menu'

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
              <Item key={id} as={NavLink} to={`/thangs/${id}`}>
                {name}
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

/*
    <Menu.Item>
      <Menu.Header>
        <FormattedMessage id={'listThangs.your'} />
      </Menu.Header>
      <ListThangs />
    </Menu.Item>
    <Menu.Item>
      <CreateThang />
    </Menu.Item>

 */
export default () => (
  <SecondaryMenu>
    <Header>
      <FormattedMessage id={'listThangs.your'} />
    </Header>
    <ListThangs />
  </SecondaryMenu>
)
