// npx epg-grabber --config=sites/abc.net.au/abc.net.au.config.js --channels=sites/abc.net.au/abc.net.au.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./abc.net.au.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2022-12-22', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ABC1',
  xmltv_id: 'ABCTV.au'
}
it('can generate valid url', () => {
  expect(url({ date })).toBe('https://epg.abctv.net.au/processed/Sydney_2022-12-22.json')
})

it('can parse response', () => {
  const content = `{"date":"2022-12-22","region":"Sydney","schedule":[{"channel":"ABC1","listing":[{"consumer_advice":"Adult Themes, Drug Use, Violence","rating":"M","show_id":912747,"repeat":true,"description":"When tragedy strikes close to home, it puts head teacher Noah Taylor on a collision course with the criminals responsible. Can the Lyell team help him stop the cycle of violence?","title":"Silent Witness","crid":"ZW2178A004S00","start_time":"2022-12-22T00:46:00","series-crid":"ZW2178A","live":false,"captioning":true,"show_type":"Episode","series_num":22,"episode_title":"Lift Up Your Hearts (part Two)","length":58,"onair_title":"Silent Witness","end_time":"2022-12-22T01:44:00","genres":["Entertainment"],"image_file":"ZW2178A004S00_460.jpg","prog_slug":"silent-witness","episode_num":4}]}]}`

  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'Silent Witness',
      sub_title: 'Lift Up Your Hearts (part Two)',
      description: `When tragedy strikes close to home, it puts head teacher Noah Taylor on a collision course with the criminals responsible. Can the Lyell team help him stop the cycle of violence?`,
      category: ['Entertainment'],
      rating: {
        system: 'ACB',
        value: 'M'
      },
      season: 22,
      episode: 4,
      icon: 'https://www.abc.net.au/tv/common/images/publicity/ZW2178A004S00_460.jpg',
      start: '2022-12-21T13:46:00.000Z',
      stop: '2022-12-21T14:44:00.000Z'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser(
    {
      content: `<Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message><Key>processed/Sydney_2023-01-17.json</Key><RequestId>6MRHX5TJ12X39B3Y</RequestId><HostId>59rH6XRMrmkFywg8Kv58iqpI6O1fuOCuEbKa1HRRYa4buByXMBTvAhz8zuAK7X5D+ZN9ZuWxyGs=</HostId></Error>`
    },
    channel
  )
  expect(result).toMatchObject([])
})
