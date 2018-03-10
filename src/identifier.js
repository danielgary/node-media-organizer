import fetch from 'isomorphic-fetch'
const TV_REGEX = /s?(\d\d?)[ex\.](\d\d)/i
const TVDB_BASE_URL = 'https://api.thetvdb.com'
let TVDB_ACCESS_TOKEN

function tvdbRequest (endpoint, method, body) {
  const url = `${TVDB_BASE_URL}/${endpoint}`
  return fetch(url, {
    method: method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': TVDB_ACCESS_TOKEN ? `Bearer ${TVDB_ACCESS_TOKEN}` : undefined
    },
    body: body && JSON.stringify(body)
  }).then((response) => {
    return response.json()
  })
}

export function authenticateForTVDB (tvdbAccountDetails) {
  return tvdbRequest('login', 'POST', tvdbAccountDetails).then((result) => {
    TVDB_ACCESS_TOKEN = result.token
    return result.token
  })
}

export function isTVFileName (fileName) {
  return fileName.match(TV_REGEX)
}

export function guessTVSeriesName (description) {
  const match = TV_REGEX.exec(description)
  if (match) {
    return description.substring(0, match.index).trim()
  }
  return description
}

export function searchForSeries (seriesName) {
  return tvdbRequest(`search/series?name=${encodeURIComponent(seriesName)}`).then((result) => {
    if (result.data && result.data.length > 0) {
      return result.data[0]
    } else {
      return undefined
    }
  })
}
export function getSeasonAndEpisode (description) {
  const matches = description.match(TV_REGEX)
  if (matches && matches.length >= 3) {
    return {
      season: parseInt(matches[1]),
      episode: parseInt(matches[2])
    }
  } else {
    return {
      season: -1,
      episode: -1
    }
  }
}

export function getSeriesEpisodes (seriesId, episodes = [], page = 1) {
  return tvdbRequest(`/series/${seriesId}/episodes?page=${page}`).then((response) => {
    episodes.push(...response.data)
    if (response.links.next) {
      return getSeriesEpisodes(seriesId, episodes, response.links.next)
    } else {
      return episodes
    }
  })
}
