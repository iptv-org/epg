const glob = require('glob')
const fs = require('fs')

function list(pattern, include = [], exclude = []) {
  return new Promise(resolve => {
    glob(pattern, function (err, files) {
      if (include.length) {
        include = include.map(filename => `channels/${filename}.xml`)
        files = files.filter(filename => include.includes(filename))
      }

      if (exclude.length) {
        exclude = exclude.map(filename => `channels/${filename}.xml`)
        files = files.filter(filename => !exclude.includes(filename))
      }

      resolve(files)
    })
  })
}

function read(filename) {
  return fs.readFileSync(filename, { encoding: 'utf8' })
}

module.exports = {
  list,
  read
}
