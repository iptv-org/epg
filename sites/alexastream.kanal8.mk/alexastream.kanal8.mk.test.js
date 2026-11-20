const { parser, url } = require('./alexastream.kanal8.mk.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const date = dayjs.utc('2026-11-16', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'Kanal8.mk',
  xmltv_id: 'Kanal8.mk@HD'
}

it('can generate valid url', () => {
  expect(url).toBe('https://alexastream.kanal8.mk/epg.xml')
})

it('can parse response', () => {
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<tv>
  <channel id="Kanal8.mk">
    <display-name>Kanal 8</display-name>
  </channel>
  <programme start="20261116080000 +0100" stop="20261116090000 +0100" channel="Kanal8.mk">
    <title lang="mk">Утринска програма</title>
    <desc lang="mk">Информативна емисија</desc>
  </programme>
</tv>`

  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results).toEqual([
    {
      title: 'Утринска програма',
      description: 'Информативна емисија',
      start: '2026-11-16T07:00:00.000Z',
      stop: '2026-11-16T08:00:00.000Z'
    }
  ])
})
