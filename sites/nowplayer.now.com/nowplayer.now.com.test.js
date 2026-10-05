const { parser, url, request } = require('./nowplayer.now.com.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

process.env.EPG_DETAILED_GUIDE_DELAY = 0

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc().startOf('d')
const channel = {
  lang: 'en',
  site_id: '150',
  xmltv_id: 'AnimaxAsia.sg@SD'
}

axios.get.mockImplementation(url => {
  const urls = {
    'https://nowplayer.now.com/tvguide/epglist?channelIdList[]=150&day=1': 'content.json',
    'https://nowplayer.now.com/tvguide/epgprogramdetail?programId=202606244351477': 'program01.json',
    'https://nowplayer.now.com/tvguide/epgprogramdetail?programId=202606244351525': 'program02.json'
  }
  let data = ''
  if (urls[url] !== undefined) {
    data = JSON.parse(fs.readFileSync(path.join(__dirname, '__data__', urls[url])))
  }
  return Promise.resolve({ data })
})


it('can generate valid url for today', () => {
  expect(url({ channel, date })).toBe(
    'https://nowplayer.now.com/tvguide/epglist?channelIdList[]=150&day=1'
  )
})

it('can generate valid url for tomorrow', () => {
  expect(url({ channel, date: date.add(1, 'd') })).toBe(
    'https://nowplayer.now.com/tvguide/epglist?channelIdList[]=150&day=2'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers({ channel })).toMatchObject({
    cookie: 'LANG=en'
  })
})

it('can parse en response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = (await parser({ content, channel, date }))
    .map(p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    })

  expect(result.length).toBe(49)
  expect(result[0]).toMatchObject({
    start: '2026-07-11T16:00:00.000Z',
    stop: '2026-07-11T16:30:00.000Z',
    title: 'Ragna Crimson S1E2 -The Beginning Of The Story',
    description:
      'Ragna uses his newly gained power to hunt dragons and makes a resolution to avoid the miserable future that awaits him.',
    categories: ['Anime'],
    year: '2023'
  })
  expect(result[48]).toMatchObject({
    start: '2026-07-12T15:58:00.000Z',
    stop: '2026-07-12T16:30:00.000Z',
    title: 'Fruits Basket S2E25 -I\'m Different Now',
    description:
      'Kureno watches a copy of the Cinderella-ish play which Tohru prepared, hoping that he will realize Arisa\'s feelings for him.',
    categories: ['Anime'],
    year: '2020'
  })
})

it('can parse zh response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = (await parser({ content, channel: { ...channel, lang: 'zh' }, date }))
    .map(p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    })

  expect(result.length).toBe(49)
  expect(result[0]).toMatchObject({
    start: '2026-07-11T16:00:00.000Z',
    stop: '2026-07-11T16:30:00.000Z',
    title: '第2集 - The Beginning Of The Story',
    description:
      '翼之血族在各地發動全面進攻, 拉格納運用獲得的力量與新出現的上級龍梅古卜帝戰鬥, 而他在此時所遇見的少女又是何許人物?未來與現在的記憶混亂不清, 為了迴避自己曾經歷過的淒慘未來, 拉格納決定投入與龍族的戰鬥, 並下定決心與某人道別。',
    categories: ['Anime'],
    year: '2023'
  })
  expect(result[48]).toMatchObject({
    start: '2026-07-12T15:58:00.000Z',
    stop: '2026-07-12T16:30:00.000Z',
    title: '第25集 - I\'m Different Now',
    description:
      '紅野看了小透準備的一個類似灰姑娘的故事, 並希望他能知道亞里紗對自己的感覺。',
    categories: ['Anime'],
    year: '2020'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    content: '[[]]'
  })
  expect(result).toMatchObject([])
})
