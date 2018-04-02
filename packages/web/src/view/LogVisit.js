// @flow

import React from 'react'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'

class OnMount extends React.Component<{ f: () => mixed }> {
  componentDidMount () {
    this.props.f()
  }

  render () {
    return null
  }
}

const LOG_VISIT = gql`
    mutation visit($id: ID!) {
        visitThang (id: $id) {
            thang {
                id
            }
        }
    }
`

class LogVisit extends React.Component<{ thang: string }> {
  render () {
    return (
      <Mutation mutation={LOG_VISIT}>
        {logVisit => (<OnMount f={() => logVisit({variables: {id: this.props.thang}})} />)}
      </Mutation>
    )
  }
}

export default LogVisit
