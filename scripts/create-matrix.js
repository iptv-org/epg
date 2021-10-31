const { Command } = require('commander')
const file = require('./file')
const path = require('path')

const program = new Command()
program
  .option('--include <include>', 'List of files to include', parseList)
  .option('--exclude <exclude>', 'List of files to exclude', parseList)
  .parse(process.argv)

const options = program.opts()

file.list('sites/*/*.channels.xml', options.include, options.exclude).then(files => {
  const matrix = {
    guide: []
  }

  files.forEach(filename => {
    const [_, site, country] = filename.match(/sites\/.*\/(.*)_(.*)\.channels\.xml/i)
    const config = require(path.resolve(`./sites/${site}/${site}.config.js`))

    if (config.ignore) return

    matrix.guide.push({ site, country })
  })

  const output = `::set-output name=matrix::${JSON.stringify(matrix)}`
  console.log(output)
})

function parseList(str) {
  if (!str) return []

  return str.split(',')
}
