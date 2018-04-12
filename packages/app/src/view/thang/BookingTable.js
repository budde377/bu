// @flow

import React from 'react'
import { FormattedDate } from 'react-intl'
import moment from 'moment-timezone'
import { Mutation, Query } from 'react-apollo'
import gql from 'graphql-tag'
import {
  Body as TBaddy, Cell, FauxCheck, Header, HeaderCell, Row, Table, TableScroll, Time,
  TimeCell, InterCell
} from '../styled/BookinTable'
import { Avatar } from '../styled/User'

type BookingTableProps = {
  thang: string,
  timezone: string
}

const range = (n) => Array(n).fill(0).map((x, y) => x + y)

function findCell (e: ?Element, stopper: ?Element): ?{ cellIndex: number, rowIndex: number } {
  if (!e || e === stopper) return null
  const cellIndex = e.dataset.cellIndex
  const rowIndex = e.dataset.rowIndex
  if (cellIndex && rowIndex) {
    return {cellIndex: parseInt(cellIndex), rowIndex: parseInt(rowIndex)}
  }
  return findCell(e.parentElement, stopper)
}

const GET_BOOKINGS = gql`
    query bookings($thang: ID!, $from: DateTimeInput!, $to: DateTimeInput!) {
        thang(id: $thang) {
            id
            bookings(input: {from: $from, to: $to}) {
                id
                owner {
                    id
                    picture
                }
                from {
                    day
                    month
                    minute
                    hour
                    year
                }
                to {
                    day
                    month
                    minute
                    hour
                    year
                }
            }
        }
        me {
            id
        }
    }
`

const CREATE_BOOKING = gql`
    mutation createBooking ($thang: ID!, $from: DateTimeInput!, $to: DateTimeInput!){
        createBooking(thang: $thang, from: $from, to: $to) {
            id
        }
    }
`
const DELETE_BOOKING = gql`
    mutation deleteBooking ($id: ID!){
        deleteBooking(id: $id){
            deleted
        }
    }
`

const SUBSCRIBE_BOOKINGS = gql`
    subscription subscribeBookings($thang: ID!, $from: DateTimeInput!, $to: DateTimeInput!) {
        bookingsChange(thang: $thang, input: {from: $from, to: $to}) {
            add {
                id
                owner {
                    id
                    picture
                }
                from {
                    day
                    month
                    minute
                    hour
                    year
                }
                to {
                    day
                    month
                    minute
                    hour
                    year
                }
            }
            remove {
                id
            }
            change {
                id
                from {
                    day
                    month
                    minute
                    hour
                    year
                }
                owner {
                    id
                    picture
                }
                to {
                    day
                    month
                    minute
                    hour
                    year
                }
            }
        }
    }
`

type Dt = {
  hour: number,
  minute: number,
  day: number,
  month: number,
  year: number
}

function momentToDt (m: moment): Dt {
  const hour = m.hour()
  const minute = m.minute()
  const month = m.month() + 1
  const day = m.date()
  const year = m.year()
  return {
    hour, minute, month, day, year
  }
}

type Booking = {
  from: Dt,
  to: Dt,
  owner: { picture: string, id: string },
  id: string
}

type Bookings = {
  [number]: { // Year
    [number]: { // Month
      [number]: { // Day
        [number]: Booking // Hour
      }
    }
  }
}

function parseBookings (bs: Booking[]): Bookings {
  return bs.reduce((acc, booking) => {
    const {from: {year, month, day, hour}} = booking
    if (!acc[year]) {
      acc[year] = {}
    }
    if (!acc[year][month]) {
      acc[year][month] = {}
    }
    if (!acc[year][month][day]) {
      acc[year][month][day] = {}
    }
    if (!acc[year][month][day][hour]) {
      acc[year][month][day][hour] = {}
    }
    acc[year][month][day][hour] = booking
    return acc
  }, {})
}

class BookingTableBody extends React.Component<{ me: ?string, days: number, offset: moment, now: moment, thang: string, bookings: ?Array<Booking>, subscribe: () => (() => mixed) }, { bookings: Bookings }> {
  _unsubscribe: ?() => mixed = null

  constructor (props: *) {
    super(props)
    const bookings = parseBookings(props.bookings || [])
    this.state = {bookings}
  }

  componentDidMount () {
    this._unsubscribe = this.props.subscribe()
  }

  componentWillReceiveProps ({bookings, days, offset, subscribe}) {
    if (!offset.isSame(this.props.offset, 'd') || days !== this.props.days) {
      if (this._unsubscribe) {
        this._unsubscribe()
      }
      this._unsubscribe = subscribe()
    }

    if (bookings === this.props.bookings) {
      return
    }
    this.setState({bookings: parseBookings(bookings || [])})
  }

  _onClick = (createMutator, deleteMutator) => (evt: MouseEvent) => {
    const target = evt.target
    if (!(target instanceof Element)) {
      return
    }
    const position = findCell(target)
    if (!position) {
      return
    }
    const {cellIndex, rowIndex} = position
    const start = this.props.offset.clone().hour(rowIndex).add(cellIndex, 'd')
    const end = start.clone().add(1, 'h')
    const current = this._currentBooking(momentToDt(start))
    if (current) {
      deleteMutator({
        variables: {
          id: current.id
        }
      })
    } else {
      createMutator({
        variables: {
          thang: this.props.thang,
          from: momentToDt(start),
          to: momentToDt(end)
        }
      })
    }
  }

  _currentBooking (n: Dt): ?Booking {
    return (
      this.state.bookings[n.year] &&
      this.state.bookings[n.year][n.month] &&
      this.state.bookings[n.year][n.month][n.day] &&
      this.state.bookings[n.year][n.month][n.day][n.hour]
    )
  }

  render () {
    return (
      <Mutation mutation={DELETE_BOOKING}>
        {(deleteMutator) =>
          <Mutation mutation={CREATE_BOOKING}>
            {(createMutator) => {
              return (
                <TBaddy onClick={this._onClick(createMutator, deleteMutator)}>
                  <TableScroll>
                    {
                      range(24)
                        .map(i => (
                          <Row key={i}>
                            <TimeCell>
                              <Time>
                                {i + 1}:00
                              </Time>
                            </TimeCell>
                            {range(this.props.days)
                              .map((j) => {
                                const n = this.props.offset.clone().add(j, 'd').hour(i)
                                const current = this._currentBooking(momentToDt(n))
                                return (
                                  <Cell
                                    key={j} data-cell-index={j} data-row-index={i} me={this.props.me}
                                    owner={current && current.owner.id}
                                    percent={(this.props.now.isSame(n, 'h') ? this.props.now.minute() / 60 : (Math.max(0, Math.min(1, this.props.now.diff(n, 'h')))))}>
                                    <InterCell>
                                      {
                                        current
                                          ? (
                                            <Avatar picture={current.owner.picture} />)
                                          : (<FauxCheck />)
                                      }
                                    </InterCell>
                                  </Cell>
                                )
                              })}
                          </Row>
                        ))
                    }
                  </TableScroll>
                </TBaddy>
              )
            }}
          </Mutation>
        }
      </Mutation>
    )
  }
}

class OnResize extends React.Component<{ on: (p: number) => mixed }> {
  _ref: ?HTMLDivElement = null

  _resize = () => {
    if (!this._ref) {
      return
    }
    this.props.on(this._ref.offsetWidth)
  }

  componentDidMount () {
    window.addEventListener('resize', this._resize)
    if (!this._ref) {
      return
    }
    this.props.on(this._ref.offsetWidth)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._resize)
  }

  _rp = (ref: ?HTMLDivElement) => {
    this._ref = ref
  }

  render () {
    return (
      <div ref={this._rp} />
    )
  }
}

class Clock extends React.Component<{ tick: (t: moment) => mixed, tz: string }> {
  _interval: ?IntervalID

  componentDidMount () {
    this._interval = setInterval(() => this.props.tick(moment.tz(this.props.tz)), 10 * 1000)
  }

  componentWillUnmount () {
    if (!this._interval) {
      return
    }
    clearInterval(this._interval)
  }

  render () {
    return null
  }
}

class BookingTable extends React.Component<BookingTableProps, { days: number, now: moment }> {
  state = {days: 1, now: moment.tz(this.props.timezone)}

  _resize = (p: number) => this.setState({days: Math.ceil(p / 250)})
  _updateTime = (now: moment) => this.setState({now})

  render () {
    const now = this.state.now
    const from = now.clone().hour(0).minute(0)
    const to = from.clone().add(Math.max(1, this.state.days), 'd')
    const variables = {from: momentToDt(from), to: momentToDt(to), thang: this.props.thang}
    return (
      <Table>
        <Clock tick={this._updateTime} tz={this.props.timezone} />
        <OnResize on={this._resize} />
        <Header>
          <Row>
            <HeaderCell />
            {range(this.state.days).map(i => {
              const dt = from.clone().add(i, 'd')
              return (
                <HeaderCell key={i} today={dt.isSame(now, 'd')}>
                  <FormattedDate
                    weekday={'short'}
                    month={'long'}
                    year={from.year() !== to.year() ? 'numeric' : undefined}
                    day={'numeric'}
                    value={dt.toDate()}
                  />
                </HeaderCell>
              )
            })}
          </Row>
        </Header>
        <Query
          query={GET_BOOKINGS}
          fetchPolicy='cache-and-network'
          variables={variables}>
          {({loading, error, data, subscribeToMore}) => {
            return (
              <BookingTableBody
                me={(data && data.me && data.me.id) || null}
                days={this.state.days}
                subscribe={() =>
                  subscribeToMore({
                    document: SUBSCRIBE_BOOKINGS,
                    variables,
                    updateQuery: (prev, {subscriptionData}) => {
                      if (!subscriptionData.data) return prev
                      const {bookingsChange: {add, change, remove}} = subscriptionData.data
                      const old = prev.thang.bookings
                      const t1 = add
                        ? [...old, add]
                        : old
                      const t2 = change
                        ? t1.map((t) => t.id === change.id ? change : t)
                        : t1
                      const bookings = remove
                        ? t2.filter((t) => t.id !== remove.id)
                        : t2
                      return {...prev, thang: {...prev.thang, bookings}}
                    }
                  })
                }
                now={now}
                offset={from}
                thang={this.props.thang}
                bookings={data && data.thang ? data.thang.bookings : null} />
            )
          }}
        </Query>
      </Table>
    )
  }
}

export default BookingTable
