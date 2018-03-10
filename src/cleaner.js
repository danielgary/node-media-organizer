import path from 'path'
import fs from 'fs'

const SAMPLE_REGEX = /\bsample\b/i

export default function cleanFileName (file, config) {
  if (isFileTooSmall(file, config.minFileSize)) {
    return undefined
  } else {
    const fileName = path.basename(file)
    const withoutChars = removeExcludedCharacters(fileName, config.excludeCharacters || [])
    const pieces = splitName(withoutChars)
    const withoutExtensions = removeWords(pieces, config.videoExtensions)
    const withoutWords = removeWords(withoutExtensions, config.excludeWords)
    const description = withoutWords.join(' ')
    return {
      dir: path.dirname(file),
      fileName: fileName,
      description: description,
      sample: isSampleFile(description)
    }
  }
}

function isFileTooSmall (filePath, minFileSize) {
  return fs.lstatSync(filePath) < minFileSize
}

function isSampleFile (fileName) {
  return SAMPLE_REGEX.test(fileName)
}

function removeExcludedCharacters (name, chars) {
  for (var i = 0; i < chars.length; i++) {
    name = name.replace(new RegExp(`\\${chars[i]}`), '')
  }
  return name
}

function removeWords (parts, words) {
  const lowerCaseWords = words.map((w) => w.toLowerCase())
  const lowerCaseParts = parts.map((p) => p.toLowerCase())
  return lowerCaseParts.filter((p) => lowerCaseWords.indexOf(p) === -1)
}

function splitName (name) {
  const matches = name.match(/\b[\w']+\b/gi)
  return matches
}
