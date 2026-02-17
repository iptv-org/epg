const { parser, url } = require('./raiplay.it.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-05-03', 'YYYY-MM-DD')
const channel = {
  site_id: 'rai-2',
  xmltv_id: 'Rai2.it'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.raiplay.it/palinsesto/app/rai-2/03-05-2022.json')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-05-03T17:40:00.000Z',
      stop: '2022-05-03T18:30:00.000Z',
      title: 'The Good Doctor S3E5 - La prima volta',
      description:
        "Shaun affronta il suo primo intervento. Il caso si rivela complicato e, nonostante Shaun abbia un'idea geniale, sarà Andrews a portare a termine l'operazione.",
      season: '3',
      episode: '5',
      sub_title: 'La prima volta',
      image: 'https://www.raiplay.it/dl/img/2020/03/09/1583748471860_dddddd.jpg',
      url: 'https://www.raiplay.it/dirette/rai2/The-Good-Doctor-S3E5---La-prima-volta-2f81030d-803b-456a-9ea5-40233234fd9d.html'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
