// @flow
import React from 'react'

export type Config = {
  api: {http: string, ws: string}
}

export default ({content, config, apolloState}: { apolloState: *, content: string, config: Config}) => (
  <html>
    <head>
      <title>Thang.io</title>
      {process.env.NODE_ENV === 'production' ? <script src={'/styles.js'} async /> : null}
      {process.env.NODE_ENV === 'production' ? <link rel={'stylesheet'} type={'text/css'} href={'/styles.css'} /> : null}
      <script
        type={'application/javascript'}
        dangerouslySetInnerHTML={{__html: `window.__CONFIG__ = ${JSON.stringify(config).replace(/</g, '\\u003c')}`}} />
      <script
        type={'application/javascript'}
        dangerouslySetInnerHTML={{__html: `window.__APOLLO_STATE__ = ${JSON.stringify(apolloState).replace(/</g, '\\u003c')}`}} />
      <script src={'/main.js'} async defer />
    </head>
    <body>
      <div id={'content'} dangerouslySetInnerHTML={{__html: content}} />
    </body>
  </html>
)
