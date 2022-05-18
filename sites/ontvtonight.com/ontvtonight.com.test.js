// npx epg-grabber --config=sites/ontvtonight.com/ontvtonight.com.config.js --channels=sites/ontvtonight.com/ontvtonight.com_au.channels.xml --output=guide.xml --days=2
// npx epg-grabber --config=sites/ontvtonight.com/ontvtonight.com.config.js --channels=sites/ontvtonight.com/ontvtonight.com_us.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./ontvtonight.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'au#1692/7two',
  xmltv_id: '7two.au'
}
const content = `<!DOCTYPE html><html lang="en-AU" xmlns:og="http://opengraphprotocol.org/schema/" xmlns:fb="http://www.facebook.com/2008/fbml"> <head> </head> <body> <div id="wrapper"> <section id="content"> <div class="container"> <div class="row"> <div class="span6"> <img src="https://otv-us-web.s3-us-west-2.amazonaws.com/logos/guide/media/ed49cf4f-1123-4bee-9c90-a6af375af310.png" border="0" align="right" alt="7TWO" width="140"/> <table class="table table-hover"> <tbody> <tr> <td width="90"> <h5 class="thin">12:10 am</h5> </td><td> <h5 class="thin"> <a href="https://www.ontvtonight.com/au/guide/listings/programme?cid=1692&amp;sid=165632&amp;dt=2021-11-24+13%3A10%3A00" target="_blank" rel="nofollow" > What A Carry On</a > </h5> </td></tr><tr> <td width="90"> <h5 class="thin">12:50 am</h5> </td><td> <h5 class="thin"> <a href="https://www.ontvtonight.com/au/guide/listings/programme?cid=1692&amp;sid=159923&amp;dt=2021-11-24+13%3A50%3A00" target="_blank" rel="nofollow" > Bones</a > </h5> <h6>The Devil In The Details</h6> </td></tr><tr> <td width="90"> <h5 class="thin">10:50 pm</h5> </td><td> <h5 class="thin"> <a href="https://www.ontvtonight.com/au/guide/listings/programme?cid=1692&amp;sid=372057&amp;dt=2021-11-25+11%3A50%3A00" target="_blank" rel="nofollow" > Inspector Morse: The Remorseful Day</a > </h5> </td></tr></tbody> </table> </div></div></div></section> </div></body></html>`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.ontvtonight.com/au/guide/listings/channel/1692/7two.html?dt=2021-11-25'
  )
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T13:10:00.000Z',
      stop: '2021-11-24T13:50:00.000Z',
      title: `What A Carry On`
    },
    {
      start: '2021-11-24T13:50:00.000Z',
      stop: '2021-11-25T11:50:00.000Z',
      title: `Bones`,
      description: 'The Devil In The Details'
    },
    {
      start: '2021-11-25T11:50:00.000Z',
      stop: '2021-11-25T12:50:00.000Z',
      title: `Inspector Morse: The Remorseful Day`
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
