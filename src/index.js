#!/usr/bin/env node
import Promise from 'bluebird'
import path from 'path'
import scan from './scanner'
import clean from './cleaner'
import { authenticateForTVDB, isTVFileName, guessTVSeriesName, searchForSeries, getSeasonAndEpisode, getSeriesEpisodes } from './identifier'
import _ from 'lodash'
const config = require('../defaultConfig')
const yargs = require('yargs')

const args = yargs.options({
  'directory': {
    alias: 'd',
    describe: 'Directory containing the media you want to scan',
    demandOption: true
  },
  'output-directory': {
    alias: 'o',
    describe: 'Base destination directory'
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

authenticateForTVDB(config.providers.tvdb).then((accessToken) => {
  const files = scan(fullPath, config)
  const fileDetails = files.map((f) => clean(f, config)).filter((f) => !f.sample)

  if (args.type === 'tv') {
    processTVEpisodes(fileDetails)
  }
})

function processTVEpisodes (files) {
  const episodes = files.map((f) => ({
    ...f,
    ...getSeasonAndEpisode(f.description)
  }))
  const seriesNames = _.compact(_.uniq(episodes.map((f) => isTVFileName(f.fileName) && guessTVSeriesName(f.description))))
  return Promise.map(seriesNames, (s, si, sl) => {
    return searchForSeries(s).then((series) => {
      if (series && series.id) {
        return getSeriesEpisodes(series.id).then((realEpisodes) => {
          return {
            realName: series.seriesName,
            localName: s,
            episodes: realEpisodes
          }
        })
      } else {
        return {
          realName: series ? series.seriesName : s,
          localName: s,
          episodes: []
        }
      }
    })
  }, { concurrency: 10 }).then((series) => {
    series.map((s) => {
      const seriesEpisodes = episodes.filter((e) => guessTVSeriesName(e.description) === s.localName)
      s.seasons = _.uniq(seriesEpisodes.map((e) => e.season)).map((seasonNumber) => ({
        season: seasonNumber,
        episodes: seriesEpisodes.filter((e) => e.season === seasonNumber)
      }))

      s.moves = generateSeriesChange(s)
      process.stdout.write(`\n# CHANGES FOR ${s.realName}`)
      s.moves.map((m) => process.stdout.write(`\n${m}`))
      process.stdout.write('\n\n')
    })
  })
}

function generateSeriesChange (series) {
  const base = args['output-directory'] || args['directory']
  const seriesPath = path.resolve(path.join(base, series.realName))
  const moves = []
  series.seasons.map((s) => {
    const seasonPath = path.join(seriesPath, `Season ${s.season}`)
    moves.push(`mkdir -p "${seasonPath}"`)
    return s.episodes.map((e) => {
      const foundEpisode = series.episodes.find((re) => re.airedSeason === e.season && re.airedEpisodeNumber === e.episode)

      const episodeString = `S${s.season.toString().padStart(2, '0')}E${e.episode.toString().padStart(2, '0')}`
      const episodeName = foundEpisode ? ` - ${foundEpisode.episodeName}` : ''

      const fileDestination = path.join(seasonPath, `${series.realName} - ${episodeString}${episodeName}${path.extname(e.fileName)}`)
      const source = path.join(e.dir, e.fileName)

      moves.push(`mv "${source}" "${fileDestination}"`)
    })
  })
  return moves
}
