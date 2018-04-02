// @flow
import compose from 'koa-compose'
import image from './image'
import graphql from './graphql'

export default compose([graphql, image])
