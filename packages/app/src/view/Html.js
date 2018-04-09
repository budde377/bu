// @flow
import React from 'react'

export type Config = {
  api: { http: string, ws: string },
  accessToken: ?string
}

export default ({styles, content, config, apolloState, version}: { styles: Array<*>, apolloState: *, content: string, config: Config, version: string }) => (
  <html>
    <head>
      <title>Thang.io</title>
      <link
        href='https://fonts.googleapis.com/css?family=Fira+Sans:300,300i|Lato:400,700|Open+Sans:400,400i,700'
        rel='stylesheet' />
      <link rel={'stylesheet'} href={'/base.css'} />
      <link rel='apple-touch-icon' sizes='57x57' href='/apple-icon-57x57.png' />
      <link rel='apple-touch-icon' sizes='60x60' href='/apple-icon-60x60.png' />
      <link rel='apple-touch-icon' sizes='72x72' href='/apple-icon-72x72.png' />
      <link rel='apple-touch-icon' sizes='76x76' href='/apple-icon-76x76.png' />
      <link rel='apple-touch-icon' sizes='114x114' href='/apple-icon-114x114.png' />
      <link rel='apple-touch-icon' sizes='120x120' href='/apple-icon-120x120.png' />
      <link rel='apple-touch-icon' sizes='144x144' href='/apple-icon-144x144.png' />
      <link rel='apple-touch-icon' sizes='152x152' href='/apple-icon-152x152.png' />
      <link rel='apple-touch-icon' sizes='180x180' href='/apple-icon-180x180.png' />
      <link rel='icon' type='image/png' sizes='192x192' href='/android-icon-192x192.png' />
      <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
      <link rel='icon' type='image/png' sizes='96x96' href='/favicon-96x96.png' />
      <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />
      <link rel='manifest' href='/manifest.json' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <meta name='msapplication-TileColor' content='#ffffff' />
      <meta name='msapplication-TileImage' content='/ms-icon-144x144.png' />
      <meta name='theme-color' content='#ffffff' />
      {process.env.NODE_ENV === 'production' ? <script src={`/styles.js?v=${version}`} async /> : null}
      {process.env.NODE_ENV === 'production'
        ? <link rel={'stylesheet'} type={'text/css'} href={`/styles.css?v=${version}`} /> : null}
      <script
        type={'application/javascript'}
        dangerouslySetInnerHTML={{__html: `window.__CONFIG__ = ${JSON.stringify(config).replace(/</g, '\\u003c')}`}} />
      <script
        type={'application/javascript'}
        dangerouslySetInnerHTML={{__html: `window.__APOLLO_STATE__ = ${JSON.stringify(apolloState).replace(/</g, '\\u003c')}`}} />
      <script src={`/main.js?v=${version}`} async defer />
      {styles}
    </head>
    <body>
      <div id={'content'} dangerouslySetInnerHTML={{__html: content}} />
      <div id={'modal-root'} />
    </body>
  </html>
)
