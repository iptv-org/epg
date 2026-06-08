const { parser, url } = require('./sky.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2026-06-08').startOf('d')
const channel = {
  site_id: '4086',
  xmltv_id: 'SkyHistory.uk@HD'
}

axios.get.mockImplementation(url => {
  const urls = {
    'https://awk.epgsky.com/hawk/linear/schedule/20260608/4086': 'content1.json',
    'https://awk.epgsky.com/hawk/linear/schedule/20260609/4086': 'content2.json'
  }
  let data = ''
  if (urls[url] !== undefined) {
    data = fs.readFileSync(path.join(__dirname, '__data__', urls[url])).toString()
  }
  return Promise.resolve({ data })
})

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://awk.epgsky.com/hawk/linear/schedule/20260608/4086')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content1.json'))
  const result = (await parser({ content, channel, date }))
    .map(p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    })

  expect(result.length).toBe(30)
  expect(result[0]).toMatchObject({
    start: '2026-06-07T23:45:00.000Z',
    stop: '2026-06-08T00:45:00.000Z',
    title: 'The UnBelievable With Dan Aykroyd',
    description:
      'Bizarre Innovations: Discover bizarre innovations like a fully functioning car that hovers in midair. Or clothing made out of everyone\'s favorite source of calcium. (S2, ep 6)',
    season: 2,
    episode: 6,
    icon: 'https://images.metadata.sky.com/pd-image/007ade72-3239-47d7-a452-3070eb8e591d/16-9/640',
    image: 'https://images.metadata.sky.com/pd-image/007ade72-3239-47d7-a452-3070eb8e591d/16-9/640'
  })
  expect(result[29]).toMatchObject({
    start: '2026-06-08T23:00:00.000Z',
    stop: '2026-06-09T00:00:00.000Z',
    title: 'Digging For Britain',
    description:
      'The Tudors: Dr Alice Roberts pays tribute to the Bard, visiting Shakespeare\'s first theatre in London\'s Shoreditch and sifting through the poet\'s rubbish! (S1, ep 4)',
    season: 1,
    episode: 4,
    icon: 'https://images.metadata.sky.com/pd-image/68152ae7-97d6-44c8-8a54-e78710b94a76/16-9/640',
    image: 'https://images.metadata.sky.com/pd-image/68152ae7-97d6-44c8-8a54-e78710b94a76/16-9/640'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
