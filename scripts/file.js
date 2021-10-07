const glob = require('glob')

function list(include = [], exclude = []) {
  return new Promise(resolve => {
    glob('channels/**/*.xml', function (err, files) {
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

module.exports = {
  list
}
