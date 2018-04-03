// @flow

import React from 'react'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import OnMount from './OnMount'

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
