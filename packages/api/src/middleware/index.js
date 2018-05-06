// @flow
import compose from 'koa-compose'
import image from './image'
import graphql from './graphql'
import health from './health'

export default compose([graphql, image, health])
