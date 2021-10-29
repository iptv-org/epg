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
  name?: string
  flag: string
  url: string
  channelCount: number
  emptyGuides: number
}

async function main() {
  console.log('Starting...')
  file
    .list('.gh-pages/guides/**/*.xml')
    .then((files: string[]) => {
      const guidesByCountry: Guide[] = []
      const guidesByUSState: Guide[] = []
      const guidesByCanadaProvince: Guide[] = []
      files.forEach((filename: string) => {
        console.log(`Loading '${filename}'...`)
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

        const guide: Guide = {
          flag: '',
          url: filename.replace('.gh-pages', 'https://iptv-org.github.io/epg'),
          channelCount: epg.channels.length,
          emptyGuides
        }

        if (!code.includes('-')) {
          const country: Country | undefined = countries[code]
          if (!country) return
          guide.flag = country.flag
          guide.name = country.name
          guidesByCountry.push(guide)
        } else if (code.startsWith('us-')) {
          const [_, stateCode] = code.split('-')
          const state: State | undefined = countries['us']
            ? countries['us'].states[stateCode]
            : undefined
          if (!state) return
          guide.name = state.name
          guidesByUSState.push(guide)
        } else if (code.startsWith('ca-')) {
          const [_, provinceCode] = code.split('-')
          const province: State | undefined = countries['ca']
            ? countries['ca'].states[provinceCode]
            : undefined
          if (!province) return
          guide.name = province.name
          guidesByCanadaProvince.push(guide)
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
  guides = sortGuides(guides)

  let output = '<table>\n'

  output += '\t<thead>\n\t\t<tr>'
  for (let column of header) {
    output += `<th align="left">${column}</th>`
  }
  output += '</tr>\n\t</thead>\n'

  output += '\t<tbody>\n'
  for (let guide of guides) {
    const size = guides.filter((g: Guide) => g.name === guide.name).length
    if (!guide.name) continue
    const name = `${guide.flag}&nbsp;${guide.name}`
    let root = output.indexOf(name) === -1
    const rowspan = root && size > 1 ? ` rowspan="${size}"` : ''
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
    var nameA = a.name ? a.name.toLowerCase() : ''
    var nameB = b.name ? b.name.toLowerCase() : ''
    if (nameA < nameB) return -1
    if (nameA > nameB) return 1
    return b.channelCount - a.channelCount
  })
}

main()
