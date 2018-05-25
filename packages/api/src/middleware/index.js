// @flow
import compose from 'koa-compose'
import image from './image'
import graphql from './graphql'
import health from './health'
import db from './db'

export default compose([db, graphql, image, health])
