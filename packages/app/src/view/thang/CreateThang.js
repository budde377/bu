// @flow

import React from 'react'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import { injectIntl, FormattedMessage } from 'react-intl'
import type { InjectIntlProvidedProps } from 'react-intl'
import { Hint, Form, Input, Label } from '../styled/Form'
import { Button } from '../styled/Button'

const CREATE_THANG = gql`
    mutation createThang($name: String!) {
        createThang (name: $name) {
            name
            id
        }
    }
`

class CreateThang extends React.Component<{ onCreate: (id: string) => mixed } & InjectIntlProvidedProps, { name: string, submitted: boolean }> {
  state = {name: '', submitted: false}
  _onChange = (evt: *) => this.setState({name: evt.target.value})

  _onSubmit = (createThang) => async (evt) => {
    this.setState({submitted: true})
    evt.preventDefault()
    if (!this.state.name) {
      return
    }
    const r = await createThang({variables: {name: this.state.name}})
    if (!r.data) {
      return
    }
    this.props.onCreate(r.data.createThang.id)
  }

  render () {
    return (
      <Mutation mutation={CREATE_THANG}>
        {(createThang, {data, loading}) => (
          <Form onSubmit={this._onSubmit(createThang)}>
            <Label>
              <Hint show={this.state.submitted && !this.state.name.trim()}>
                {this.props.intl.formatMessage({id: 'CreateThang.name.error'})}
              </Hint>
              <Input
                value={this.state.name}
                onChange={this._onChange}
                placeholder={this.props.intl.formatMessage({id: 'name'})} />
            </Label>
            <Button type={'submit'}>
              <FormattedMessage id={'create'} />
            </Button>
          </Form>
        )}
      </Mutation>
    )
  }
}

export default injectIntl(CreateThang)
