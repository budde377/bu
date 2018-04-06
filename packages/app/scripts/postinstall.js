#!/usr/bin/env node
const fs = require('fs')

if (!process.env.VERSION) {
  return
}

const config = {
  version: process.env.VERSION
}

fs.writeFile('./config/local.json', JSON.stringify(config))
