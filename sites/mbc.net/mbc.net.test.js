// npx epg-grabber --config=sites/mbc.net/mbc.net.config.js --channels=sites/mbc.net/mbc.net.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./mbc.net.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'mbc1',
  xmltv_id: 'MBC.ae'
}
const content = `[{"id":3140240,"channelBCMId":"1","channelLabel":"MBC1","showPageTitle":"اختطاف","showPageGenreInArabic":" دراما","showPageAboutInArabic":".يستضيف برنامج تلفزيوني والدة لينا وشقيقتها، ولدى مشاهدتها الحلقة، تكتشف والدة ماجد الحقيقة، بينما تتعرض العنود لحادث سير مروع","startTime":1636155131000,"endTime":1636157806000,"startTimeInMilliseconds":1636155131000,"endTimeInMilliseconds":1636157806200,"premiereMode":"Fast Repeat","showingNow":false}]`

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.mbc.net/.rest/api/channel/grids?from=1636156800000&to=1636243200000&channel=mbc1'
  )
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-05T23:32:11.000Z',
      stop: '2021-11-06T00:16:46.000Z',
      title: 'اختطاف',
      category: ' دراما',
      description:
        '.يستضيف برنامج تلفزيوني والدة لينا وشقيقتها، ولدى مشاهدتها الحلقة، تكتشف والدة ماجد الحقيقة، بينما تتعرض العنود لحادث سير مروع'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `[]`
  })
  expect(result).toMatchObject([])
})
