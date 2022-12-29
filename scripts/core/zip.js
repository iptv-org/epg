const { gzip, ungzip } = require('node-gzip')

const zip = {}

zip.compress = async function (string) {
  return gzip(string)
}

zip.decompress = async function (string) {
  return ungzip(string)
}

module.exports = zip
