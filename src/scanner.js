import fs from 'fs'
import path from 'path'

const REGEX_VIDEO_FILE = /.+(mv4|mp4|avi|wmv|mpg|mpeg|flv|mkv|mov|m4v)$/

export default function scan (dir) {
  const results = []
  const fullPath = path.resolve(dir)
  if (!fs.existsSync(fullPath)) {
    console.warn(`Tried to scan ${fullPath} which does not exist`)
  } else {
    const subs = getSubdirectoriesInPath(fullPath)
    results.push(...(subs.map((s) => scan(s))))
    const files = getVideoFilesInPath(dir)
    console.info(`Found ${files.length} video files`, files)
    files.map((f) => results.push(f))
  }
  return results
}

function isVideoFile (file) {
  return REGEX_VIDEO_FILE.test(file.trim())
  // return !!file.match(REGEX_VIDEO_FILE)
}

function isDirectory (dir) {
  return fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()
}

function getVideoFilesInPath (dir) {
  const fullPath = path.resolve(dir)
  if (isDirectory(dir)) {
    return fs.readdirSync(fullPath).map(name => path.join(fullPath, name)).filter(isVideoFile)
  } else {
    console.warn(`getVideoFilesInPath called for ${fullPath} which is not a directory`)
    return []
  }
}

function getSubdirectoriesInPath (dir) {
  const fullPath = path.resolve(dir)
  if (isDirectory(dir)) {
    return fs.readdirSync(fullPath).map(name => path.join(fullPath, name)).filter(isDirectory)
  } else {
    console.warn(`getSubdirectoriesInPath called for ${fullPath} which is not a directory`)
    return []
  }
}
