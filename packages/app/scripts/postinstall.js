#!/usr/bin/env node
const fs = require('fs')

if (!process.env.VERSION) {
  console.log('No version defined. Skipping.')
  return
}

const config = {
  version: process.env.VERSION
}

console.log('Writing version ' + config.version + ' to ./config.local.json')

fs.writeFile('./config/local.json', JSON.stringify(config), () => {})
