const parser = require('epg-parser')
const markdownInclude = require('markdown-include')
const countries = require('./countries.json')
const file = require('./file')

type EPG = {
  channels: Channel[]
  programs: Program[]
}

type Country = {
  flag: string
  name: string
  code: string
  states?: State[]
}

type State = {
  name: string
  code: string
}

type Channel = {
  id: string
}

type Program = {
  channel: string
}

type Guide = {
  flag: string
  name: string
  url: string
  channelCount: number
  emptyGuides: number
}

async function main() {
  console.log('Starting...')
  file
    .list('.gh-pages/guides/**/*.xml')
    .then((files: string[]) => {
      let guidesByCountry: Guide[] = []
      let guidesByUSState: Guide[] = []
      let guidesByCanadaProvince: Guide[] = []
      files.forEach((filename: string) => {
        const matches: string[] = filename.match(/\.gh\-pages\/guides\/(.*)\/.*/i) || []
        const code: string | undefined = matches[1]
        if (code === undefined) return

        const xml = file.read(filename)
        let epg: EPG = parser.parse(xml)
        let emptyGuides = 0
        epg.channels.forEach((channel: Channel) => {
          const showCount = epg.programs.filter(
            (program: Program) => program.channel === channel.id
          ).length
          if (showCount === 0) emptyGuides++
        })

        const [_, stateCode] = code.split('-')
        const country: Country | undefined = countries[code]
        const us_state: State | undefined = countries['us']
          ? countries['us'].states[stateCode]
          : undefined
        const ca_province: State | undefined = countries['ca']
          ? countries['ca'].states[stateCode]
          : undefined

        if (country !== undefined) {
          guidesByCountry.push({
            flag: country.flag,
            name: country.name,
            url: filename.replace('.gh-pages', 'https://iptv-org.github.io/epg'),
            channelCount: epg.channels.length,
            emptyGuides
          })
          guidesByCountry = sortGuides(guidesByCountry)
        } else if (us_state !== undefined) {
          guidesByUSState.push({
            flag: '',
            name: us_state.name,
            url: filename.replace('.gh-pages', 'https://iptv-org.github.io/epg'),
            channelCount: epg.channels.length,
            emptyGuides
          })
          guidesByUSState = sortGuides(guidesByUSState)
        } else if (ca_province !== undefined) {
          guidesByCanadaProvince.push({
            flag: '',
            name: ca_province.name,
            url: filename.replace('.gh-pages', 'https://iptv-org.github.io/epg'),
            channelCount: epg.channels.length,
            emptyGuides
          })
          guidesByCanadaProvince = sortGuides(guidesByCanadaProvince)
        }
      })

      console.log('Generating country table...')
      const countryTable = generateTable(guidesByCountry, ['Country', 'Channels', 'EPG', 'Status'])
      file.write('.readme/_countries.md', countryTable)

      console.log('Generating US states table...')
      const usStatesTable = generateTable(guidesByUSState, ['State', 'Channels', 'EPG', 'Status'])
      file.write('.readme/_us-states.md', usStatesTable)

      console.log('Generating Canada provinces table...')
      const caProvincesTable = generateTable(guidesByCanadaProvince, [
        'Province',
        'Channels',
        'EPG',
        'Status'
      ])
      file.write('.readme/_ca-provinces.md', caProvincesTable)

      console.log('Updating README.md...')
      markdownInclude.compileFiles('.readme/config.json')
    })
    .finally(() => {
      console.log('Finish')
    })
}

function generateTable(guides: Guide[], header: string[]) {
  let output = '<table>\n'

  output += '\t<thead>\n\t\t<tr>'
  for (let column of header) {
    output += `<th align="left">${column}</th>`
  }
  output += '</tr>\n\t</thead>\n'

  output += '\t<tbody>\n'
  for (let guide of guides) {
    const size = guides.filter((g: Guide) => g.name === guide.name).length
    let root = output.indexOf(guide.name) === -1
    const rowspan = root && size > 1 ? ` rowspan="${size}"` : ''
    const name = `${guide.flag}&nbsp;${guide.name}`
    let status = '🟢'
    if (guide.emptyGuides === guide.channelCount) status = '🔴'
    else if (guide.emptyGuides > 0) status = '🟡'
    const cell1 = root ? `<td align="left" valign="top" nowrap${rowspan}>${name}</td>` : ''
    output += `\t\t<tr>${cell1}<td align="right" nowrap>${guide.channelCount}</td><td align="left" nowrap><code>${guide.url}</code></td><td align="center">${status}</td></tr>\n`
  }
  output += '\t</tbody>\n'

  output += '</table>'

  return output
}

function sortGuides(guides: Guide[]): Guide[] {
  return guides.sort((a, b) => {
    var countryNameA = a.name.toLowerCase()
    var countryNameB = b.name.toLowerCase()
    if (countryNameA < countryNameB) return -1
    if (countryNameA > countryNameB) return 1
    return b.channelCount - a.channelCount
  })
}

main()
