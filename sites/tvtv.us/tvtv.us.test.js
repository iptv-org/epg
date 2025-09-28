const { parser, url } = require('./tvtv.us.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

axios.mockImplementation(req => {
  if (req.url === 'https://tvtv.us/api/v1/programs/EP009311820269') {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program_1.json')))
    })
  } else {
    return Promise.resolve({ data: '' })
  }
})

const date = dayjs.utc('2025-01-30', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '20373' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tvtv.us/api/v1/lineup/USA-NY71652-X/grid/2025-01-30T00:00:00.000Z/2025-01-31T00:00:00.000Z/20373'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  let results = await parser({ content, request: { agent: null } })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(33)
  expect(results[0]).toMatchObject({
    start: '2025-01-30T00:00:00.000Z',
    stop: '2025-01-30T00:30:00.000Z',
    title: 'NY Sports Nation Nightly',
    subtitle: null
  })
  expect(results[1]).toMatchObject({
    start: '2025-01-30T00:30:00.000Z',
    stop: '2025-01-30T01:00:00.000Z',
    title: 'The Big Bang Theory',
    subtitle: 'The Bow Tie Asymmetry'
    // description:
    //   "When Amy's parents and Sheldon's family arrive, everybody is focused on making sure the wedding arrangements go according to plan -- everyone except the bride and groom.",
    // image: 'https://tvtv.us/gn/pi/assets/p185554_b_v11_az.jpg?w=240&h=360',
    // date: '2018',
    // season: 11,
    // episode: 24,
    // actors: [
    //   {
    //     value: 'Johnny Galecki',
    //     role: 'Leonard Hofstadter'
    //   },
    //   {
    //     value: 'Jim Parsons',
    //     role: 'Sheldon Cooper'
    //   },
    //   {
    //     value: 'Kaley Cuoco',
    //     role: 'Penny'
    //   },
    //   {
    //     value: 'Simon Helberg',
    //     role: 'Howard Wolowitz'
    //   },
    //   {
    //     value: 'Kunal Nayyar',
    //     role: 'Raj Koothrappali'
    //   },
    //   {
    //     value: 'Mayim Bialik',
    //     role: 'Amy Farrah Fowler'
    //   },
    //   {
    //     value: 'Melissa Rauch',
    //     role: 'Bernadette Rostenkowski'
    //   },
    //   {
    //     value: 'Kevin Sussman',
    //     role: 'Stuart',
    //     guest: 'yes'
    //   },
    //   {
    //     value: 'Laurie Metcalf',
    //     role: 'Mary',
    //     guest: 'yes'
    //   },
    //   {
    //     value: 'John Ross Bowie',
    //     role: 'Kripke',
    //     guest: 'yes'
    //   },
    //   {
    //     value: 'Wil Wheaton',
    //     role: 'Himself',
    //     guest: 'yes'
    //   },
    //   {
    //     value: 'Brian Posehn',
    //     role: 'Bert',
    //     guest: 'yes'
    //   },
    //   {
    //     value: "Jerry O'Connell",
    //     role: 'George',
    //     guest: 'yes'
    //   },
    //   {
    //     value: 'Courtney Henggeler',
    //     role: 'Missy',
    //     guest: 'yes'
    //   },
    //   {
    //     value: 'Lauren Lapkus',
    //     role: 'Denise',
    //     guest: 'yes'
    //   },
    //   {
    //     value: 'Teller',
    //     role: 'Mr. Fowler',
    //     guest: 'yes'
    //   },
    //   {
    //     value: 'Kathy Bates',
    //     role: 'Mrs. Fowler',
    //     guest: 'yes'
    //   },
    //   {
    //     value: 'Mark Hamill',
    //     role: 'Himself',
    //     guest: 'yes'
    //   }
    // ],
    // directors: ['Mark Cendrowski'],
    // producers: ['Chuck Lorre', 'Bill Prady', 'Steven Molaro'],
    // writers: [
    //   'Chuck Lorre',
    //   'Steven Molaro',
    //   'Maria Ferrari',
    //   'Steve Holland',
    //   'Eric Kaplan',
    //   'Tara Hernandez'
    // ],
    // categories: ['Sitcom'],
    // ratings: [
    //   {
    //     value: 'TVPG',
    //     system: 'USA Parental Rating'
    //   }
    // ]
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    content: '[]',
    request: { agent: null }
  })

  expect(results).toMatchObject([])
})
