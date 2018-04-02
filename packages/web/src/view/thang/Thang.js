// @flow

import React from 'react'
import { Header, Label, Loader, Message } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import BookingTable from './BookingTable'
import { FormattedMessage } from 'react-intl'
import LogVisit from '../LogVisit'
import OnMount from '../OnMount'

const GET_THANG_USERS = gql`
    query getThangUsers($id: ID!){
        thang(id: $id) {
            id
            owners {
                displayName
                id
                picture
            }
            users {
                displayName
                id
                picture
            }
        }
    }
`

const SUBSCRIBE_THANG_USERS = gql`
    subscription subscribeThangUsers($id: ID!) {
        thangChange(thang: $id) {
            change {
                id
                owners {
                    displayName
                    id
                    picture
                }
                users {
                    displayName
                    id
                    picture
                }
            }
        }
    }
`

class ThangUsers extends React.Component<{ thang: string }> {
  render () {
    return (
      <Query query={GET_THANG_USERS} variables={{id: this.props.thang}}>
        {({loading, error, data, subscribeToMore}) => {
          if (loading) {
            return (
              <Loader active />
            )
          }
          if (error) {
            return null
          }
          if (!data.thang) {
            return null
          }
          const subscribe = () => subscribeToMore({
            document: SUBSCRIBE_THANG_USERS,
            variables: {id: this.props.thang},
            updateQuery: (prev, {subscriptionData}) => {
              if (!subscriptionData.data) return prev
              const {thangChange: {change}} = subscriptionData.data
              if (!change) {
                return prev
              }
              return change
            }
          })
          const owners = data.thang.owners.reduce((acc, u) => ({...acc, [u.id]: u}), {})
          const users = data.thang.users.reduce((acc, u) => (owners[u.id] ? acc : {...acc, [u.id]: u}), {})
          return (
            <Label.Group>
              <OnMount f={subscribe} />
              {Object.keys(owners)
                .map(k => owners[k])
                .map(({displayName, id, picture}) => (
                  <Label key={id} image>
                    <img src={picture} />
                    {displayName}
                    <Label.Detail>
                      <FormattedMessage id={'owner'} />
                    </Label.Detail>
                  </Label>
                ))}
              {Object.keys(users)
                .map(k => users[k])
                .map(({displayName, id, picture}) => (
                  <Label key={id} image>
                    <img src={picture} />
                    {displayName}
                    <Label.Detail>
                      <FormattedMessage id={'user'} />
                    </Label.Detail>
                  </Label>
                ))}
            </Label.Group>
          )
        }}
      </Query>
    )
  }
}

const GET_THANG = gql`
    query getThang($id: ID!){
        thang(id: $id) {
            id
            name
            timezone
        }
    }
`

class BaseThang extends React.Component<*> {
  render () {
    return (
      <Query query={GET_THANG} variables={{id: this.props.match.params.id}}>
        {({loading, error, data}) => {
          if (loading) {
            return (
              <Header>
                <FormattedMessage id={'loading'} />
              </Header>
            )
          }
          if (error) {
            return (
              <Message negative>
                <FormattedMessage id={'thangView.error'} />
              </Message>
            )
          }
          if (!data.thang) {
            return (
              <Header>
                <FormattedMessage id={'thangView.notFound'} />
              </Header>
            )
          }
          return (
            <div>
              <Header>
                {data.thang.name}
              </Header>
              <LogVisit thang={data.thang.id} />
              <ThangUsers thang={data.thang.id} key={data.thang.id} />
              <BookingTable thang={data.thang.id} timezone={data.thang.timezone} />
            </div>
          )
        }}
      </Query>
    )
  }
}

export default withRouter(BaseThang)
