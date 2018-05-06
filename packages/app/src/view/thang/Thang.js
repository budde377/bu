// @flow

import React from 'react'
import { withRouter } from 'react-router'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import BookingTable from './BookingTable'
import { FormattedMessage } from 'react-intl'
import LogVisit from '../LogVisit'
import OnMount from '../OnMount'
import Logo from '../Logo'
import { H1 } from '../styled/Header'
import { Container, Top } from '../styled/Thang'
import { Helmet } from 'react-helmet'

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

class BaseThang extends React.Component<*> {
  render () {
    return (
      <Container>
        <Query query={GET_THANG} variables={{id: this.props.match.params.id}}>
          {({loading, error, data, subscribeToMore}) => {
            if (loading) {
              return (
                <div style={{width: '5em', margin: 'auto', paddingTop: '10%'}}>
                  <Logo loading />
                </div>
              )
            }
            if (error) {
              return (
                null // TODO error handing
              )
            }
            // $FlowFixMe Update types
            const thang = (data || {}).thang
            if (!thang) {
              return (
                <H1>
                  <FormattedMessage id={'thangView.notFound'} />
                </H1>
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
            return [
              <Top key={'header'}>
                <Helmet>
                  <title>
                    {thang.name}
                  </title>
                </Helmet>
                <H1>
                  {thang.name}
                  <OnMount f={subscribe} />
                  <LogVisit thang={thang.id} />
                </H1>
              </Top>,
              <BookingTable thang={thang.id} timezone={thang.timezone} key={'table'} />
            ]
          }}
        </Query>
      </Container>
    )
  }
}

export default withRouter(BaseThang)
