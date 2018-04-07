// @flow

import React from 'react'
import { Header, Label, Message } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import BookingTable from './BookingTable'
import { FormattedMessage } from 'react-intl'
import LogVisit from '../LogVisit'
import OnMount from '../OnMount'
import LogoLoader from '../LogoLoader'

const GET_THANG = gql`
    query getThangUsers($id: ID!){
        thang(id: $id) {
            id
            name
            timezone
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

const SUBSCRIBE_THANG = gql`
    subscription subscribeThangUsers($id: ID!) {
        thangChange(thang: $id) {
            change {
                id
                name
                timezone
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

type U = {displayName: string, id: string, picture: string}

class ThangUsers extends React.Component<{ owners: U[], users: U[] }> {
  render () {
    const owners = this.props.owners.reduce((acc, u) => ({...acc, [u.id]: u}), {})
    const users = this.props.users.reduce((acc, u) => (owners[u.id] ? acc : {...acc, [u.id]: u}), {})
    return (
      <Label.Group>
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
  }
}

class BaseThang extends React.Component<*> {
  render () {
    return (
      <div key={this.props.match.params.id}>
        <Query query={GET_THANG} variables={{id: this.props.match.params.id}} ssr={false}>
          {({loading, error, data, subscribeToMore}) => {
            if (loading) {
              return (
                <div style={{width: '5em', margin: 'auto', paddingTop: '10%'}}>
                  <LogoLoader />
                </div>
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
            const subscribe = () => subscribeToMore({
              document: SUBSCRIBE_THANG,
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
            return (
              <div>
                <OnMount f={subscribe} />
                <Header>
                  {data.thang.name}
                </Header>
                <LogVisit thang={data.thang.id} />
                <ThangUsers users={data.thang.users} owners={data.thang.owners} />
                <BookingTable thang={data.thang.id} timezone={data.thang.timezone} />
              </div>
            )
          }}
        </Query>
      </div>
    )
  }
}

export default withRouter(BaseThang)
