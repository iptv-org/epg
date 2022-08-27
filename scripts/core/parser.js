const file = require('./file')
const grabber = require('epg-grabber')

const parser = {}

parser.parseChannels = async function (filepath) {
  const content = await file.read(filepath)

  return grabber.parseChannels(content)
}

parser.parseLogs = async function (filepath) {
  const content = await file.read(filepath)
  if (!content) return []
  const lines = content.split('\n')

  return lines.map(line => (line ? JSON.parse(line) : null)).filter(l => l)
}

parser.parseNumber = function (string) {
  const parsed = parseInt(string)
  if (isNaN(parsed)) {
    throw new Error('scripts/core/parser.js:parseNumber() Input value is not a number')
  }

  return parsed
}

module.exports = parser
