// @flow

import React from 'react'
import { Mutation, type MutationFunction } from 'react-apollo'
import { injectIntl, FormattedMessage } from 'react-intl'
import type { InjectIntlProvidedProps } from 'react-intl'
import { Hint, Form, Input, Label } from './styled/Form'
import { Button } from './styled/Button'
import CREATE_THANG from '../../graphql/createThang.graphql'
import type { createThangMutation, createThangMutationVariables } from '../../graphql'

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
    if (!r || !r.data) {
      return
    }
    this.props.onCreate(r.data.createThang.id)
  }

  render () {
    return (
      <Mutation mutation={CREATE_THANG}>
        {(createThang: MutationFunction<createThangMutation, createThangMutationVariables>) => (
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
              <FormattedMessage id={'createThang'} />
            </Button>
          </Form>
        )}
      </Mutation>
    )
  }
}

export default injectIntl(CreateThang)
