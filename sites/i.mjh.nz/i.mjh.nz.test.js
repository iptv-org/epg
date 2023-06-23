// npm run channels:parse -- --config=./sites/i.mjh.nz/i.mjh.nz.config.js --output=./sites/i.mjh.nz/i.mjh.nz_us-pluto.channels.xml --set=path:PlutoTV/us
// npx epg-grabber --config=sites/i.mjh.nz/i.mjh.nz.config.js --channels=sites/i.mjh.nz/i.mjh.nz_au-skygo.channels.xml --output=guide.xml

const { parser, url } = require('./i.mjh.nz.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-05-03', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'PlutoTV/us#51c75f7bb6f26ba1cd00002f',
  xmltv_id: 'LittleStarsUniverse.us',
  lang: 'en'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe(
    'https://raw.githubusercontent.com/matthuisman/i.mjh.nz/master/PlutoTV/us.xml'
  )
})

it('can parse response', () => {
  const content = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE tv SYSTEM "xmltv.dtd"><tv generator-info-name="www.matthuisman.nz"> <channel id="51c75f7bb6f26ba1cd00002f"> <display-name>Little Stars Universe</display-name> <icon src="https://images.pluto.tv/channels/51c75f7bb6f26ba1cd00002f/colorLogoPNG.png"/> </channel> <programme channel="51c75f7bb6f26ba1cd00002f" start="20220503104922 +0000" stop="20220503112122 +0000"> <title>Barney and Friends</title> <desc>Baby Bop forgets to say "please" and "thank you". Riff shares his dream of becoming an inventor.</desc> <category>Children &amp; Family</category> </programme><programme channel="51c75f7bb6f26ba1cd00002f" start="20220504104922 +0000" stop="20220504112122 +0000"> <title>Barney and Friends</title> <desc>Baby Bop forgets to say "please" and "thank you". Riff shares his dream of becoming an inventor.</desc> <category>Children &amp; Family</category> </programme></tv>`
  const results = parser({ content, channel, date })

  expect(results[0]).toMatchObject({
    start: '2022-05-03T10:49:22.000Z',
    stop: '2022-05-03T11:21:22.000Z',
    title: 'Barney and Friends',
    description:
      'Baby Bop forgets to say "please" and "thank you". Riff shares his dream of becoming an inventor.',
    categories: ['Children &amp; Family']
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: `404: Not Found`,
    channel,
    date
  })
  expect(result).toMatchObject([])
})
