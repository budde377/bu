// @flow

import React from 'react'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import { Button, Form, Message } from 'semantic-ui-react'
import { withRouter } from 'react-router'
import { injectIntl, FormattedMessage } from 'react-intl'
import type { InjectIntlProvidedProps } from 'react-intl'

const CREATE_THANG = gql`
    mutation createThang($name: String!) {
        createThang (name: $name) {
            name
            id
        }
    }
`

class CreateThang extends React.Component<InjectIntlProvidedProps, { name: string }> {
  state = {name: ''}
  _onChange = (evt: *, {value}) => this.setState({name: value})

  _renderMessage (data: *) {
    if (!data) {
      return null
    }
    return (
      <Message positive>
        <FormattedMessage
          id={'createThang.success'}
          values={{
            name: <i>{data.createThang.name}</i>
          }}
        />
      </Message>
    )
  }

  _onSubmit = (createThang) => async () => {
    if (!this.state.name) {
      return
    }
    const r = await createThang({variables: {name: this.state.name}})
    if (!r.data) {
      return
    }
    this.props.history.push(`/thangs/${r.data.createThang.id}`)
    this.setState({name: ''})
  }

  render () {
    return (
      <Mutation mutation={CREATE_THANG}>
        {(createThang, {data, loading}) => (
          <div>
            <Form onSubmit={this._onSubmit(createThang)} loading={loading}>
              {this._renderMessage(data)}
              <Form.Input
                placeholder={this.props.intl.formatMessage({id: 'name'})}
                value={this.state.name}
                onChange={this._onChange} />
              <Button type='submit' disabled={!this.state.name}>
                <FormattedMessage id={'create'} />
              </Button>
            </Form>
          </div>
        )}
      </Mutation>
    )
  }
}

export default injectIntl(withRouter(CreateThang))
