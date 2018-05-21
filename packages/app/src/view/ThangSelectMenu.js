// @flow
import React, { Fragment } from 'react'
import { FormattedMessage } from 'react-intl'
import { Mutation, Query, type QueryRenderProps, type MutationFunction } from 'react-apollo'
import { MenuLink, Empty, Item, Items, SecondaryMenu } from './styled/Menu'
import { H1 } from './styled/BuildingBlocks'
import { Button } from './styled/Button'
import { Add, Alert } from './styled/Icon'
import Modal from './Modal'
import type { ContextRouter } from 'react-router'
import GET_THANGS from '../../graphql/getThangs.graphql'
import SUBSCRIBE_THANGS from '../../graphql/subscribeThangs.graphql'
import SEND_VERIFICATION_EMAIL from '../../graphql/sendVerificationEmail.graphql'
import CreateThang from './CreateThang'
import { withRouter } from 'react-router'
import type { getThangsQuery, sendVerificationEmailMutation } from '../../graphql'
import EmailVerifiedCheck from './EmailVerifiedCheck'
import { Header, Message, Notion } from './styled/Notion'

class ThangList extends React.Component<{ subscribe: () => mixed, thangs: {| id: string, name: string |}[] }> {
  componentDidMount () {
    this.props.subscribe()
  }

  render () {
    return (
      this.props.thangs.length
        ? (
          <Items>
            {this.props.thangs.map(({id, name}) => (
              <Item key={id}>
                <MenuLink to={`/thangs/${id}`}>
                  {name}
                </MenuLink>
              </Item>
            ))}
          </Items>)
        : (
          <Empty>
            <FormattedMessage id={'listThangs.empty'} />
          </Empty>
        )
    )
  }
}

class ListThangs extends React.Component<{}> {
  render () {
    return (
      <Query query={GET_THANGS}>
        {({subscribeToMore, loading, error, data}: QueryRenderProps<getThangsQuery, {}>) => {
          const me = data && data.me ? data.me : null
          if (loading || !me) {
            return null
          }
          return (
            <ThangList thangs={me.thangs} subscribe={() => {
              subscribeToMore({
                document: SUBSCRIBE_THANGS,
                updateQuery: (prev, {subscriptionData}) => {
                  if (!subscriptionData.data) return prev
                  const {myThangsChange: {add, change, remove}} = subscriptionData.data
                  if (!prev.me) {
                    return prev
                  }
                  const oldThangs = prev.me.thangs
                  const tThangs1 = add
                    ? [...oldThangs, add]
                    : oldThangs
                  const tThangs2 = change
                    ? tThangs1.map((t) => t.id === change.id ? change : t)
                    : tThangs1
                  const thangs = remove
                    ? tThangs2.filter((t) => t.id !== remove.id)
                    : tThangs2
                  return {me: {...prev.me, thangs}}
                }
              })
            }} />
          )
        }}
      </Query>
    )
  }
}

class VerificationEmailNotion extends React.Component<{}, { sent: boolean, loading: boolean, error: boolean }> {
  state = {sent: false, loading: false, error: false}

  _renderMessage (onClick) {
    if (this.state.loading) {
      return (
        <FormattedMessage
          id={'AddThang.emailNotVerified.loadingMessage'}
        />
      )
    }
    if (this.state.error) {
      return (
        <FormattedMessage
          id={'AddThang.emailNotVerified.errorMessage'}
        />
      )
    }
    if (this.state.sent) {
      return (
        <FormattedMessage
          id={'AddThang.emailNotVerified.sentMessage'}
        />
      )
    }
    return (
      <FormattedMessage
        id={'AddThang.emailNotVerified.message'}
        values={{
          here: (
            <a href={'#'} onClick={onClick}>
              <FormattedMessage id={'AddThang.emailNotVerified.message.here'} />
            </a>)
        }} />
    )
  }

  render () {
    return (
      <Mutation mutation={SEND_VERIFICATION_EMAIL}>
        {(f: MutationFunction<sendVerificationEmailMutation>) => (
          <Notion error>
            <Alert />
            <Header>
              <FormattedMessage id={'AddThang.emailNotVerified.header'} />
            </Header>
            <Message>
              {this._renderMessage(
                async (event) => {
                  event.preventDefault()
                  this.setState({loading: true})
                  const res = await f({})
                  const error = !(res && res.data && res.data.sendVerificationEmail.sent)
                  this.setState({loading: false, error, sent: true})
                })}
            </Message>
          </Notion>
        )}
      </Mutation>
    )
  }
}

class AddThang extends React.Component<ContextRouter, { open: boolean, sesh: number }> {
  state = {open: false, sesh: 0}
  _onCreate = (id: string) => {
    this._close()
    this.props.history.push(`/thangs/${id}`)
  }
  _open = () => this.setState(({sesh}) => ({open: true, sesh: sesh + 1}))
  _close = () => this.setState({open: false})

  render () {
    return (
      <div>
        <EmailVerifiedCheck>
          {(d) => {
            if (!d) {
              return null
            }
            if (!d.emailVerified) {
              return (
                <VerificationEmailNotion />
              )
            }
            return (
              <Fragment>
                <Button fluid color={'teal'} onClick={this._open}>
                  <Add />
                  <FormattedMessage id={'createThang'} />
                </Button>
                <p>
                  <FormattedMessage id={'createThang.desc'} />
                </p>
                <Modal onClose={this._close} show={this.state.open}>
                  <H1>
                    <FormattedMessage id={'createThang'} />
                  </H1>
                  <p>
                    <FormattedMessage id={'AddThang.message'} />
                  </p>
                  <CreateThang onCreate={this._onCreate} key={this.state.sesh} />
                </Modal>
              </Fragment>
            )
          }}
        </EmailVerifiedCheck>
      </div>
    )
  }
}

const AddThangRouted = withRouter(AddThang)

export default () => (
  <SecondaryMenu>
    <H1>
      <FormattedMessage id={'listThangs.your'} />
    </H1>
    <ListThangs />
    <AddThangRouted />
  </SecondaryMenu>
)
