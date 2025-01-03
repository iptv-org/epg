const { parser, url } = require('./mytelly.co.uk.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2024-12-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '713/bbc-one-london',
  xmltv_id: 'BBCOneLondon.uk'
}

axios.get.mockImplementation(url => {
  if (
    url ===
    'https://www.mytelly.co.uk/tv-guide/listings/programme?cid=713&pid=1906433&tm=2024-12-07+00%3A00%3A00'
  ) {
    return Promise.resolve({
      data: fs.readFileSync(path.join(__dirname, '__data__', 'programme.html'))
    })
  }
  if (
    url ===
    'https://www.mytelly.co.uk/tv-guide/listings/programme?cid=713&pid=5656624&tm=2024-12-07+23%3A35%3A00'
  ) {
    return Promise.resolve({
      data: fs.readFileSync(path.join(__dirname, '__data__', 'programme2.html'))
    })
  }

  return Promise.resolve({ data: '' })
})

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.mytelly.co.uk/tv-guide/listings/channel/713/bbc-one-london.html?dt=2024-12-07'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.html'))
  const results = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(2)
  expect(results[0]).toMatchObject({
    start: '2024-12-07T00:00:00.000Z',
    stop: '2024-12-07T02:05:00.000Z',
    title: 'Captain Phillips',
    description:
      'An American cargo ship sets a dangerous course around the coast of Somalia, while inland, four men are pressed into service as pirates by the local warlords. The captain is taken hostage when the raiding party hijacks the vessel, resulting in a tense five-day crisis. Fact-based thriller, starring Tom Hanks and Barkhad Abdi',
    image:
      'https://d16ia5iwuvax6y.cloudfront.net/uk-prog-images/c44ce7b0d3ae602c0c93ece5af140815.jpg?k=VeeNdUjml3bSHdlZ0OXbGLy%2BmsLdYPwTV6iAxGkzq4dsylOCGGE7OWlqwSWt0cd0Qtrin4DkEMC0Zzdp8ZeNk2vNIQzjMF0DG0h3IeTR5NM%3D',
    category: ['Factual', 'Movie/Drama', 'Thriller']
  })
  expect(results[1]).toMatchObject({
    start: '2024-12-07T23:35:00.000Z',
    stop: '2024-12-08T00:40:00.000Z',
    title: 'The Rap Game UK',
    subTitle: 'Past and Pressure Season 6, Episode 5',
    description:
      'The artists are tasked with writing a song about their heritage. For some, the pressure of the competition proves too much for them to match. In their final challenge, they are put face to face with industry experts who grill them about their plans after the competition. Some impress, while others leave the mentors confused',
    image:
      'https://d16ia5iwuvax6y.cloudfront.net/uk-prog-images/2039278182b27cc279570b9ab9b89379.jpg?k=VeeNdUjml3bSHdlZ0OXbGLy%2BmsLdYPwTV6iAxGkzq4cDhR7jXTNFW3tgwQCdOPUobhXwlT81mIsqOe93HPusDG6tw1aoeYOgafojtynNWxc%3D',
    category: ['Challenge/Reality Show', 'Show/Game Show'],
    season: 6,
    episode: 5
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    date,
    channel,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
