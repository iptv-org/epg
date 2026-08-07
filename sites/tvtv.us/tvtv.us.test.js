// Mock the playwright adapter before requiring config
jest.mock('../../scripts/helpers/playwright-adapter', () => ({
  playwrightAdapter: jest.fn(),
  cleanup: jest.fn()
}))

const { parser, url } = require('./tvtv.us.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2026-08-07', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '10709' }

it('can generate valid url', () => {
  const result = url({ channel, date })
  expect(result).toContain('https://www.tvtv.us/partial/source/')
  expect(result).toContain('/10709')
})

it('can parse response', async () => {
  const content = `<div class="grid-row" data-source="10709">
    <div class="gridAiring R CC w-60" data-id="EP057797650027" data-time="1786060800000" data-runtime="60" data-qualifiers="CC,DVS,Stereo">
      The 1% Club<span class="gridSubtitle">I'm Just Dumb</span>
    </div>
    <div class="gridAiring O CC w-60" data-id="EP057892140017" data-time="1786064400000" data-runtime="60" data-qualifiers="CC,DVS,Stereo">
      Best Medicine<span class="gridSubtitle">Doc Martin</span>
    </div>
  </div>`

  let results = await parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(2)
  expect(results[0]).toMatchObject({
    start: '2026-08-07T00:00:00.000Z',
    stop: '2026-08-07T01:00:00.000Z',
    title: 'The 1% Club',
    subtitle: 'I\'m Just Dumb'
  })
  expect(results[1]).toMatchObject({
    start: '2026-08-07T01:00:00.000Z',
    stop: '2026-08-07T02:00:00.000Z',
    title: 'Best Medicine',
    subtitle: 'Doc Martin'
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    content: '<div></div>'
  })

  expect(results).toMatchObject([])
})
