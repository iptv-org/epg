const { Command } = require('commander')
const file = require('./file')
const grabber = require('epg-grabber')

const program = new Command()
program
  .option('--include <include>', 'List of files to include', parseList)
  .option('--exclude <exclude>', 'List of files to exclude', parseList)
  .parse(process.argv)

const options = program.opts()

file.list('sites/**/*.channels.xml', options.include, options.exclude).then(files => {
  const matrix = {
    guide: []
  }

  files.forEach(filename => {
    const country = filename.match(/sites\/.*\/.*_(.*)\.channels\.xml/i)[1]

    const channelsFile = file.read(filename)
    const parsed = grabber.parseChannels(channelsFile)
    matrix.guide.push({
      site: parsed.site,
      country
    })
  })

  const output = `::set-output name=matrix::${JSON.stringify(matrix)}`
  console.log(output)
})

function parseList(str) {
  if (!str) return []

  return str.split(',')
}
