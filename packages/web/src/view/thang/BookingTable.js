// @flow

import React from 'react'
import { Checkbox, Image, Table } from 'semantic-ui-react'
import { FormattedDate } from 'react-intl'
import moment from 'moment-timezone'
import { Mutation, Query } from 'react-apollo'
import gql from 'graphql-tag'

type BookingTableProps = {
  thang: string,
  timezone: string
}

const range = (n) => Array(n).fill(0).map((x, y) => x + y)

function findCell (e: ?Element, stopper: ?Element): ?HTMLTableCellElement {
  if (!e || e === stopper) return null
  if (e instanceof HTMLTableCellElement) {
    return e
  }
  return findCell(e.parentElement, stopper)
}

function cellPosition (cell: HTMLTableCellElement): ?{ cellIndex: number, rowIndex: number } {
  const cellIndex = cell.cellIndex
  const parent = cell.parentElement
  if (!parent || !(parent instanceof HTMLTableRowElement)) {
    return null
  }
  const rowIndex = parent.rowIndex
  if (typeof rowIndex !== 'number') {
    return null
  }
  return {cellIndex, rowIndex}
}

const GET_BOOKINGS = gql`
    query bookings($thang: ID!, $from: DateTimeInput!, $to: DateTimeInput!) {
        thang(id: $thang) {
            id
            bookings(input: {from: $from, to: $to}) {
                id
                owner {
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
  owner: { picture: string },
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

class BookingTableBody extends React.Component<{ now: moment, thang: string, bookings: ?Array<Booking>, subscribe: () => mixed }, { bookings: Bookings }> {
  constructor (props: *) {
    super(props)
    const bookings = parseBookings(props.bookings || [])
    this.state = {bookings}
  }

  componentDidMount () {
    this.props.subscribe()
  }

  componentWillReceiveProps ({bookings}) {
    if (bookings === this.props.bookings) {
      return
    }
    this.setState({bookings: parseBookings(bookings || [])})
  }

  _ref: ?HTMLTableSectionElement = null
  _onClick = (createMutator, deleteMutator) => (evt: MouseEvent) => {
    const target = evt.target
    if (!(target instanceof Element)) {
      return
    }
    const cell = findCell(target, this._ref)
    if (!cell) {
      return
    }
    const position = cellPosition(cell)
    if (!position) {
      return
    }
    const {cellIndex, rowIndex} = position
    const start = this.props.now.clone().hour(rowIndex - 1).add(cellIndex - 1, 'd')
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
  _refPuller = (r: ?HTMLTableSectionElement) => {
    this._ref = r
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
                <Table.Body onClick={this._onClick(createMutator, deleteMutator)} ref={this._refPuller}>
                  {
                    range(24)
                      .map(i => (
                        <Table.Row key={i}>
                          <Table.Cell textAlign={'right'}>
                            {i}:00-{i + 1}:00
                          </Table.Cell>
                          {range(4)
                            .map((j) => {
                              const n = this.props.now.clone().add(j, 'd').add(i, 'h')
                              const current = this._currentBooking(momentToDt(n))
                              return (
                                <Table.Cell textAlign={'center'} key={j}>
                                  {
                                    current
                                      ? (<Image avatar src={current.owner.picture} />)
                                      : (<Checkbox checked={false} />)
                                  }
                                </Table.Cell>
                              )
                            })}
                        </Table.Row>
                      ))
                  }
                </Table.Body>
              )
            }}
          </Mutation>
        }
      </Mutation>
    )
  }
}

function dtToString (dt: Dt) {
  return `${dt.year}.${dt.month}.${dt.day}.${dt.hour}.${dt.minute}`
}

class BookingTable extends React.Component<BookingTableProps> {
  _now: moment

  constructor (props: *) {
    super(props)
    this._now = moment.tz(props.timezone).hour(0).minute(0)
  }

  render () {
    const now = this._now
    const from = momentToDt(now)
    const to = momentToDt(now.clone().add(4))
    const variables = {from, to, thang: this.props.thang}
    const key = `${this.props.thang}.${dtToString(from)}.${dtToString(to)}` // Force remount when vars change
    return (
      <Table definition>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell style={{width: '3em'}} />
            <Table.HeaderCell textAlign={'center'}>
              <FormattedDate
                units={'day'}
                month={'long'}
                year={'numeric'}
                day={'numeric'}
                value={now.toDate()}
              />
            </Table.HeaderCell>
            <Table.HeaderCell textAlign={'center'}>
              <FormattedDate
                units={'day'}
                month={'long'}
                year={'numeric'}
                day={'numeric'}
                value={now.clone().add(1, 'd').toDate()}
              />
            </Table.HeaderCell>
            <Table.HeaderCell textAlign={'center'}>
              <FormattedDate
                units={'day'}
                month={'long'}
                year={'numeric'}
                day={'numeric'}
                value={now.clone().add(2, 'd').toDate()}
              />
            </Table.HeaderCell>
            <Table.HeaderCell textAlign={'center'}>
              <FormattedDate
                units={'day'}
                month={'long'}
                year={'numeric'}
                day={'numeric'}
                value={now.clone().add(3, 'd').toDate()}
              />
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Query
          key={key}
          query={GET_BOOKINGS}
          fetchPolicy='cache-and-network'
          variables={variables}>
          {({loading, error, data, subscribeToMore}) => {
            return (
              <BookingTableBody
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
