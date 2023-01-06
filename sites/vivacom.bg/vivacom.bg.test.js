// npx epg-grabber --config=sites/vivacom.bg/vivacom.bg.config.js --channels=sites/vivacom.bg/vivacom.bg.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./vivacom.bg.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-05', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '1#БНТ 1 HD', xmltv_id: 'BNT1.bg' }
const content = `<!DOCTYPE html><head></head> <body class="bg-BG" lang="en-UK"><div class="table site-table"> <main>  <div class="block-preview no-pb"> <section> <div class="wrapper"> <div class="tv-schedule">  <div class="schedule"> <div class="sidebar"> <div class="inner"> <ol id="scroll-vertical"> <li title="БНТ 1 HD"> <img src="/web/files/richeditor/tv/bnt-1-hd.png" width="90" height="60" alt="БНТ 1 HD" class="additional" /> </li> <li title="bTV HD"> <img src="/web/files/richeditor/tv/btv-hd-80x50.png" width="90" height="60" alt="bTV HD" /> </li> <li title="Nova TV"> <img src="/web/files/richeditor/tv/tv-channels-logos/nova-80x50.png" width="90" height="60" alt="Nova TV" /> </li> <li title="Nova HD "> <img src="/web/files/richeditor/tv/nova-tv-blue-logo-80x50.png" width="90" height="60" alt="Nova HD " /> </li> <li title="VIVACOM Arena HD"> <img src="/web/files/richeditor/tv/vivacom-arena-new-logo.png" width="90" height="60" alt="VIVACOM Arena HD" /> </li> <li title="Nova News HD"> <img src="/web/files/richeditor/tv/nova-news-hd-80x50.png" width="90" height="60" alt="Nova News HD" /> </li> <li title="bTV Comedy HD"> <img src="/web/files/richeditor/tv/btv-comedy-hd-80x50.png" width="90" height="60" alt="bTV Comedy HD" /> </li> <li title="bTV Cinema HD"> <img src="/web/files/richeditor/tv/btv-cinema-hd-80x50.png" width="90" height="60" alt="bTV Cinema HD" /> </li> <li title="bTV Action HD"> <img src="/web/files/richeditor/tv/tv-channels-logos/btv-actionhd-newlogo.png" width="90" height="60" alt="bTV Action HD" /> </li> <li title="Diema"> <img src="/web/files/richeditor/tv/tv-channels-logos/diema-80x50.png" width="90" height="60" alt="Diema" /> </li> </ol> </div> </div> <div class="content"><div class="inner"> <div id="scroll-horizontal"> <ul> <li style="width: 270px;"> <h3>Когато сърцето зове</h3> <span>04:25:00 - 05:10:00</span> <p>Телевизионен филм. Тв филм /4 сезон, 5 епизод/п/</p> </li> <li style="width: 270px;"> <h3>Dreamy Nights: Songs & Rhymes</h3> <span>23:30:00 - 00:00:00</span> <p>Songs & Rhymes, Flowers, Milky Way, Close Your Eyes, Twilight</p> </li> </ul> </div> </div> </div>  </div>  </section> </div> </main>`

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe('https://www.vivacom.bg/bg/tv/programa/?date=2021-11-05&page=1')
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-05T02:25:00.000Z',
      stop: '2021-11-05T03:10:00.000Z',
      title: 'Когато сърцето зове',
      description: 'Телевизионен филм. Тв филм /4 сезон, 5 епизод/п/'
    },
    {
      start: '2021-11-05T21:30:00.000Z',
      stop: '2021-11-05T22:00:00.000Z',
      title: 'Dreamy Nights: Songs & Rhymes',
      description: 'Songs & Rhymes, Flowers, Milky Way, Close Your Eyes, Twilight'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><head></head> <body class="bg-BG" lang="en-UK"><div class="table site-table"> <main>  <div class="block-preview no-pb"> <section> <div class="wrapper"> <div class="tv-schedule">  <div class="schedule"> <div class="sidebar"> <div class="inner"> <ol id="scroll-vertical"> </ol> </div> </div> <div class="content"> <div class="inner"> <div id="scroll-horizontal"> </div> </div> </div>  </div>  </section> </div> </main>`
  })
  expect(result).toMatchObject([])
})
