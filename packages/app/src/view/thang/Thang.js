// @flow

import React, { Fragment } from 'react'
import { type ContextRouter, withRouter } from 'react-router'
import { Query, type QueryRenderProps } from 'react-apollo'
import BookingTable from './BookingTable'
import { FormattedMessage } from 'react-intl'
import LogVisit from '../LogVisit'
import OnMount from '../OnMount'
import Logo from '../Logo'
import { H1 } from '../styled/BuildingBlocks'
import { Container, Top } from '../styled/Thang'
import { Helmet } from 'react-helmet'
import GET_THANG from '../../../graphql/getThang.graphql'
import SUBSCRIBE_THANG from '../../../graphql/subscribeThang.graphql'
import type { getThangQuery, getThangQueryVariables } from '../../../graphql'

class BaseThang extends React.Component<ContextRouter> {
  render () {
    return (
      <Container>
        <Query query={GET_THANG} variables={{id: this.props.match.params.id || ''}}>
          {({loading, error, data, subscribeToMore}: QueryRenderProps<getThangQuery, getThangQueryVariables>) => {
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
            const thang = data && data.thang ? data.thang : null
            if (!thang) {
              return (
                <H1>
                  <FormattedMessage id={'thangView.notFound'} />
                </H1>
              )
            }
            const subscribe = () => subscribeToMore({
              document: SUBSCRIBE_THANG,
              variables: {id: this.props.match.params.id || ''},
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
              <Fragment>
                <Top>
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
                </Top>
                <BookingTable thang={thang.id} timezone={thang.timezone} />
              </Fragment>
            )
          }}
        </Query>
      </Container>
    )
  }
}

export default withRouter(BaseThang)
