// npx epg-grabber --config=sites/hd-plus.de/hd-plus.de.config.js --channels=sites/hd-plus.de/hd-plus.de.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./hd-plus.de.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1-2-3-tv-hd',
  xmltv_id: '123tv.de'
}
const content = `<!DOCTYPE html><html> <head lang="de"></head> <body data-sensory-parallax-role="main" data-sensory-controller='{"controllerName": "OffscreenController"}' class="webshop-epg red" > <main data-sensory-controller='{"controllerName": "TeaserController"}'> <div class="grid-container-epg channel"> <div class="site_overlay"> <div class="loading_icon"></div></div><div class="site_wrapper"> <div id="UIChannelContent-619fb9d2e185d" class="channel-content"> <header> <img src="//cdn.hd-plus.de/senderlogos/bright-cropped/24444-2.png" alt="1-2-3.tv HD" class="channel-image"/> <h2 class="title">1-2-3.tv HD</h2> </header> <table> <thead> <tr> <th>Titel</th> <th>Ausstrahlungszeit</th> </tr></thead> <tbody> <tr> <td> <a href="/epg/show/1-2-3-tv-hd-ihre-lieblingsuhren/1442396582" >Ihre Lieblingsuhren</a > </td><td>Do 25.11 00:00</td></tr><tr> <td> <a href="/epg/show/1-2-3-tv-hd-ihre-lieblingsuhren/1442396584" >Ihre Lieblingsuhren</a > </td><td>Do 25.11 01:00</td></tr><tr> <td><a href="/epg/show/1-2-3-tv-hd-flash-deals/1452944370">Flash Deals</a></td><td>Do 25.11 06:00</td></tr></tbody> </table> </div></div></div></main> </body></html>`

it('can generate valid url', () => {
  const today = dayjs.utc().startOf('d')
  expect(url({ channel, date: today })).toBe('https://www.hd-plus.de/epg/channel/1-2-3-tv-hd?d=0')
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T23:00:00.000Z',
      stop: '2021-11-25T00:00:00.000Z',
      title: `Ihre Lieblingsuhren`
    },
    {
      start: '2021-11-25T00:00:00.000Z',
      stop: '2021-11-25T05:00:00.000Z',
      title: `Ihre Lieblingsuhren`
    },
    {
      start: '2021-11-25T05:00:00.000Z',
      stop: '2021-11-25T06:00:00.000Z',
      title: `Flash Deals`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
