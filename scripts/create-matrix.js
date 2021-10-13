const { Command } = require('commander')
const file = require('./file')
const parser = require('./parser')

const program = new Command()
program
  .option('--include <include>', 'List of files to include', parseList)
  .option('--exclude <exclude>', 'List of files to exclude', parseList)
  .parse(process.argv)

const options = program.opts()

file.list('sites/*.channels.xml', options.include, options.exclude).then(files => {
  const matrix = {
    guide: []
  }

  files.forEach(filename => {
    const channelsFile = file.read(filename)
    const parsed = parser.parseChannels(channelsFile)
    parsed.groups.forEach(group => {
      matrix.guide.push({
        site: parsed.site,
        country: group.country.toLowerCase()
      })
    })
  })

  const output = `::set-output name=matrix::${JSON.stringify(matrix)}`
  console.log(output)
})

function parseList(str) {
  if (!str) return []

  return str.split(',')
}
