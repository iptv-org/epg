const markdownInclude = require('markdown-include')
const path = require('path')
const fs = require('fs')
const countries = require('./countries.json')
const file = require('./file.js')

async function main() {
  console.log('Starting...')
  file
    .list([], ['us-local'])
    .then(files => {
      files = files.map(str => str.match(/channels\/(.*).xml/i)[1])
      generateTable(files)
      generateReadme()
    })
    .finally(() => {
      console.log('Finish')
    })
}

function generateTable(files) {
  console.log('Generating countries table...')

  const output = []
  for (const country of countries) {
    if (files.includes(country.code)) {
      output.push({
        country: `${country.flag}&nbsp;${country.name}`,
        guide: `<code>https://iptv-org.github.io/epg/guides/${country.code}.epg.xml</code>`
      })
    }
  }

  const table = generateHtmlTable(output, {
    columns: [
      { name: 'Country', align: 'left', nowrap: true },
      { name: 'EPG', align: 'left', nowrap: true }
    ]
  })

  fs.writeFileSync(path.resolve('./.readme/_countries.md'), table)
}

function generateHtmlTable(data, options) {
  let output = '<table>\n'

  output += '\t<thead>\n\t\t<tr>'
  for (let column of options.columns) {
    output += `<th align="${column.align}">${column.name}</th>`
  }
  output += '</tr>\n\t</thead>\n'

  output += '\t<tbody>\n'
  for (let item of data) {
    output += '\t\t<tr>'
    let i = 0
    for (let prop in item) {
      const column = options.columns[i]
      let nowrap = column.nowrap
      let align = column.align
      output += `<td align="${align}"${nowrap ? ' nowrap' : ''}>${item[prop]}</td>`
      i++
    }
    output += '</tr>\n'
  }
  output += '\t</tbody>\n'

  output += '</table>'

  return output
}

function generateReadme() {
  console.log('Generating README.md...')
  markdownInclude.compileFiles(path.resolve('.readme/config.json'))
}

main()
