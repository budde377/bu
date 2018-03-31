// @flow

import React from 'react'
import { Header, Label, Message } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import BookingTable from './BookingTable'
import { FormattedMessage } from 'react-intl'

const GET_THANG = gql`
    query getThang($id: ID!){
        thang(id: $id) {
            id
            name
            timezone
            owners {
                name
                id
                picture
            }
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
              <Label.Group>
                {data.thang.owners.map(({name, id, picture}) => (
                  <Label key={id} image>
                    <img src={picture} />
                    {name}
                    <Label.Detail>
                      <FormattedMessage id={'owner'} />
                    </Label.Detail>
                  </Label>
                ))}
              </Label.Group>
              <BookingTable thang={data.thang.id} timezone={data.thang.timezone} />
            </div>
          )
        }}
      </Query>
    )
  }
}

export default withRouter(BaseThang)
