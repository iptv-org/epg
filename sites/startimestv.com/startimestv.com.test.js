const { parser, url } = require('./startimestv.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1023102509',
  xmltv_id: 'ZeeOneAfrica.za'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.startimestv.com/channeldetail/1023102509/2024-12-10.html'
  )
})

it('can parse response', () => {
  const fs = require('fs')
  const path = require('path')
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.html'))
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(22)
  expect(result[0]).toMatchObject({
    start: '2024-12-10T00:00:00.000Z',
    stop: '2024-12-10T01:00:00.000Z',
    title: 'Deserted S1 E37',
    description:
      'Tora approaches Tubri for help, but she expresses her helplessness in seeking assistance from Arjun. Meanwhile, other family members are caught in the crossfire, trying to navigate their own positions within the household.',
    season: 1,
    episode: 37
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content:
      '<!DOCTYPE html><html> <body> <div id="body" class="page"> <div class="block"> <div class="channel"> <div class="title1"> <h3 style="text-transform:uppercase;"></h3> </div><div class="content"> <div class="des" style="background-color:#FFAB00"> <div class="sdw"></div><div class="inner clearfix"> <div class="pic"> <img src="" onerror="onerror=null;src=\'/Public/static/images/channellogo.png\'"> </div><div class="inf"> <h3 style="text-transform:uppercase;"></h3> <div class="num"> </div><div class="box"> <p class="rate" data="">Rate: <i></i><i></i><i></i><i></i><i></i></p><p>Category: </p><br/> </div></div><div class="txt"> <p></p></div></div></div></div></div></div></div></body></html>'
  })
  expect(result).toMatchObject([])
})
