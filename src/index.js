#!/usr/bin/env node
import path from 'path'
import scan from './scanner'
const yargs = require('yargs')

const args = yargs.options({
  'directory': {
    alias: 'd',
    describe: 'Directory containing the media you want to scan',
    demandOption: true
  },
  'type': {
    alias: 't',
    describe: 'Type of media contained within the directory - [tv, movies]',
    demandOption: true
  },
  'apply-changes': {
    describe: 'Apply the changes to disk instead of writing to stdout'
  }
}).argv

const fullPath = path.resolve(args.directory)
const results = scan(fullPath)
console.log(results)
