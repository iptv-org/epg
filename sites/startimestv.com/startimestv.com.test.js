// npm run channels:parse -- --config=./sites/startimestv.com/startimestv.com.config.js --output=./sites/startimestv.com/startimestv.com.channels.xml --set=country:ke
// npx epg-grabber --config=sites/startimestv.com/startimestv.com.config.js --channels=sites/startimestv.com/startimestv.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./startimestv.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-04-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1023102509',
  xmltv_id: 'ZeeOneAfrica.za'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.startimestv.com/channeldetail/1023102509/2022-04-10.html'
  )
})

it('can parse response', () => {
  const content = `<!DOCTYPE html><html> <body> <div id="body" class="page"> <div class="block"> <div class="channel"> <div class="content"> <div class="tv_gui"> <div class="list"> <div class="inner wap-list"> <div class="box" style="width:157.6px"> <div class="in"> <h3>Guddan S2 E77</h3> <div class="t">00:00-01:00</div><p>Vickrant is overjoyed to see Akshat in pain and not knowing what to do.</p></div><div class="mask"> <h4>00:00-01:00 Guddan S2 E77</h4> <p>Vickrant is overjoyed to see Akshat in pain and not knowing what to do.</p></div></div></div></div></div></div></div></div></div></body></html>`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-04-10T00:00:00.000Z',
      stop: '2022-04-10T01:00:00.000Z',
      title: 'Guddan S2 E77',
      season: 2,
      episode: 77,
      description: 'Vickrant is overjoyed to see Akshat in pain and not knowing what to do.'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `<!DOCTYPE html><html> <body> <div id="body" class="page"> <div class="block"> <div class="channel"> <div class="title1"> <h3 style="text-transform:uppercase;"></h3> </div><div class="content"> <div class="des" style="background-color:#FFAB00"> <div class="sdw"></div><div class="inner clearfix"> <div class="pic"> <img src="" onerror="onerror=null;src='/Public/static/images/channellogo.png'"> </div><div class="inf"> <h3 style="text-transform:uppercase;"></h3> <div class="num"> </div><div class="box"> <p class="rate" data="">Rate: <i></i><i></i><i></i><i></i><i></i></p><p>Category: </p><br/> </div></div><div class="txt"> <p></p></div></div></div></div></div></div></div></body></html>`
  })
  expect(result).toMatchObject([])
})
