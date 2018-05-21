// @flow
import * as React from 'react'
import GET_ME from '../../graphql/getMe.graphql'
import type { getMeQuery } from '../../graphql'
import { Query, type QueryRenderProps } from 'react-apollo'

export default ({children}: { children: (d: ?{| id: string, emailVerified: boolean |}) => React.Node }) => (
  <Query query={GET_ME}>
    {({data}: QueryRenderProps<getMeQuery>) => (
      children(data && data.me && typeof data.me.emailVerified === 'boolean'
        ? {
          id: data.me.id,
          emailVerified: data.me.emailVerified
        }
        : null)
    )}
  </Query>
)
