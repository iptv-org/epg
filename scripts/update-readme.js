const markdownInclude = require('markdown-include')
const path = require('path')
const fs = require('fs')
const countries = require('./countries.json')
const parser = require('./parser')
const file = require('./file')

async function main() {
  console.log('Starting...')
  file
    .list('sites/*.channels.xml')
    .then(files => {
      let data = []
      files.forEach(filename => {
        const channelsFile = file.read(filename)
        const parsed = parser.parseChannels(channelsFile)
        parsed.groups.forEach(group => {
          const country = countries.find(c => c.code === group.country.toLowerCase())
          data.push({
            countryFlag: country.flag,
            countryName: country.name,
            guideUrl: `https://iptv-org.github.io/epg/guides/${country.code}/${parsed.site}.epg.xml`,
            channelCount: group.channels.length
          })
        })
      })

      data = data.sort((a, b) => {
        var nameA = a.countryName.toLowerCase()
        var nameB = b.countryName.toLowerCase()
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
        return b.channelCount - a.channelCount
      })

      const table = generateTable(data, ['Country', 'Channels', 'EPG'])
      file.write('./.readme/_table.md', table)
      generateReadme()
    })
    .finally(() => {
      console.log('Finish')
    })
}

function generateTable(data, header) {
  let output = '<table>\n'

  output += '\t<thead>\n\t\t<tr>'
  for (let column of header) {
    output += `<th align="left">${column}</th>`
  }
  output += '</tr>\n\t</thead>\n'

  output += '\t<tbody>\n'
  for (let item of data) {
    const size = data.filter(i => i.countryName === item.countryName).length
    let root = output.indexOf(item.countryName) === -1
    const rowspan = root && size > 1 ? ` rowspan="${size}"` : ''
    const cell1 = root
      ? `<td align="left" valign="top" nowrap${rowspan}>${item.countryFlag}&nbsp;${item.countryName}</td>`
      : ''
    output += `\t\t<tr>${cell1}<td align="right" nowrap>${item.channelCount}</td><td align="left" nowrap><code>${item.guideUrl}</code></td></tr>\n`
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
