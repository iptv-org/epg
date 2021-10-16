const parser = require('epg-parser')
const markdownInclude = require('markdown-include')
const countries = require('./countries.json')
const file = require('./file')

async function main() {
  console.log('Starting...')
  file
    .list('.gh-pages/guides/**/*.xml')
    .then(files => {
      let data = []
      files.forEach(filename => {
        const countryCode = filename.match(/\.gh\-pages\/guides\/(.*)\/.*/i)[1]
        const country = countries.find(c => c.code === countryCode)
        if (!country) return
        const epg = file.read(filename)
        const parsed = parser.parse(epg)
        let emptyGuides = 0
        parsed.channels.forEach(channel => {
          const showCount = parsed.programs.filter(p => p.channel === channel.id).length
          if (showCount === 0) emptyGuides++
        })
        data.push({
          countryFlag: country.flag,
          countryName: country.name,
          guideUrl: filename.replace('.gh-pages', 'https://iptv-org.github.io/epg'),
          channelCount: parsed.channels.length,
          emptyGuides
        })
      })

      data = data.sort((a, b) => {
        var countryNameA = a.countryName.toLowerCase()
        var countryNameB = b.countryName.toLowerCase()
        if (countryNameA < countryNameB) return -1
        if (countryNameA > countryNameB) return 1
        return b.channelCount - a.channelCount
      })

      console.log('Generating table...')
      const table = generateTable(data, ['Country', 'Channels', 'EPG', 'Status'])
      file.write('.readme/_table.md', table)
      console.log('Updating README.md...')
      markdownInclude.compileFiles('.readme/config.json')
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
    const name = item.countryName
    let status = '🟢'
    if (item.emptyGuides === item.channelCount) status = '🔴'
    else if (item.emptyGuides > 0) status = '🟡'
    const cell1 = root
      ? `<td align="left" valign="top" nowrap${rowspan}>${item.countryFlag}&nbsp;${name}</td>`
      : ''
    output += `\t\t<tr>${cell1}<td align="right" nowrap>${item.channelCount}</td><td align="left" nowrap><code>${item.guideUrl}</code></td><td align="center">${status}</td></tr>\n`
  }
  output += '\t</tbody>\n'

  output += '</table>'

  return output
}

main()
