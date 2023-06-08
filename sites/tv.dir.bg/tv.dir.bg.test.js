// node ./scripts/commands/parse-channels.js --config=./sites/tv.dir.bg/tv.dir.bg.config.js --output=./sites/tv.dir.bg/tv.dir.bg.channels.xml
// npx epg-grabber --config=sites/tv.dir.bg/tv.dir.bg.config.js --channels=sites/tv.dir.bg/tv.dir.bg.channels.xml --output=guide.xml

const { parser, url } = require('./tv.dir.bg.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-01-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '12',
  xmltv_id: 'BTV.bg'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tv.dir.bg/tv_channel.php?id=12&dd=20.01')
})

it('can parse response', () => {
  const content = `<!DOCTYPE html><html><head></head><body><div class="container" id="news"><div class="row"><div class="col-sm-12 col-md-5"><ul id="events"><li><i></i> <div class="progress"> <div class="progress-bar progress-bar-striped active" role="progressbar" style="width:99%"> </div></div></li><li><a href="tv_show_info.php?id"="10"><i>06.00</i>„<b>Тази сутрин</b>” - информационно предаване с водещи Златимир Йочеви Биляна Гавазова</a></li><li><i>15.00</i>„Доктор Чудо” - сериал, еп.71</li><li><a href="tv_show_info.php?id"="1601"><i>05.30</i>„<b>Лице в лице</b>” /п./ </a></li></ul></div></div></div></body></html>`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-20T04:00:00.000Z',
      stop: '2022-01-20T13:00:00.000Z',
      title: `„Тази сутрин” - информационно предаване с водещи Златимир Йочеви Биляна Гавазова`
    },
    {
      start: '2022-01-20T13:00:00.000Z',
      stop: '2022-01-21T03:30:00.000Z',
      title: `„Доктор Чудо” - сериал, еп.71`
    },
    {
      start: '2022-01-21T03:30:00.000Z',
      stop: '2022-01-21T04:00:00.000Z',
      title: `„Лице в лице” /п./`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body><div class="container" id="news"><div class="row"><div class="col-sm-12 col-md-5"><ul id="events"></ul></div></div></div></body></html>`
  })
  expect(result).toMatchObject([])
})
