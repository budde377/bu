// @flow

import React from 'react'
import { Mutation, type MutationFunction } from 'react-apollo'
import OnMount from './OnMount'
import LOG_VISIT from '../../graphql/logVisit.graphql'
import type { logVisitMutationVariables } from '../../graphql'

class LogVisit extends React.Component<{ thang: string }> {
  render () {
    return (
      <Mutation mutation={LOG_VISIT}>
        {(logVisit: MutationFunction<logVisitMutationVariables>) => (
          <OnMount f={() => logVisit({variables: {id: this.props.thang}})} />)}
      </Mutation>
    )
  }
}

export default LogVisit
