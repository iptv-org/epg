// [Geo-blocked] node ./scripts/channels.js --config=./sites/canalplus-caraibes.com/canalplus-caraibes.com.config.js --output=./sites/canalplus-caraibes.com/canalplus-caraibes.com_bl.channels.xml --set=country:bl
// npx epg-grabber --config=sites/canalplus-caraibes.com/canalplus-caraibes.com.config.js --channels=sites/canalplus-caraibes.com/canalplus-caraibes.com_bl.channels.xml --output=.gh-pages/guides/bl/canalplus-caraibes.com.epg.xml --days=2

const { parser, url } = require('./canalplus-caraibes.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const channel = {
  site_id: '60020',
  xmltv_id: 'CanalPlusReunion.fr'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/53001/channel/60020/events?filter.day=0'
  )
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/53001/channel/60020/events?filter.day=1'
  )
})

it('can parse response', () => {
  const content = `{"timeSlices":[{"contents":[{"title":"Fin des programmes","thirdTitle":"MA TV","startTime":1636768800,"endTime":1636855200,"onClick":{"displayTemplate":"miniDetail","displayName":"Fin des programmes","URLPage":"https://service.canal-overseas.com/ott-frontend/vector/63001/event/110427432","URLVitrine":"https://service.canal-overseas.com/ott-frontend/vector/63001/program/0/recommendations"},"programID":0,"diffusionID":"110427432","URLImageDefault":"https://service.canal-overseas.com/image-api/v1/image/generic","URLImage":"https://service.canal-overseas.com/image-api/v1/image/generic"}],"timeSlice":"0"},{"contents":[{"title":"Le cercle","subtitle":"5 Novembre 2021","thirdTitle":"CANAL+ HD","startTime":1636793201,"endTime":1636795901,"onClick":{"displayTemplate":"miniDetail","displayName":"Le cercle","URLPage":"https://service.canal-overseas.com/ott-frontend/vector/63001/event/110427540","URLVitrine":"https://service.canal-overseas.com/ott-frontend/vector/63001/program/193072081/recommendations"},"programID":193072081,"diffusionID":"110427540","URLImageDefault":"https://service.canal-overseas.com/image-api/v1/image/2a311987c642d97485d5f531e698dfb7","URLImage":"https://service.canal-overseas.com/image-api/v1/image/2de336e6a8c962921638c8aeee5f7e52"}],"timeSlice":"1"},{"contents":[],"timeSlice":"2"},{"contents":[],"timeSlice":"3"},{"contents":[],"timeSlice":"4"}]}`
  const result = parser({ content })

  expect(result).toMatchObject([
    {
      start: '2021-11-13T08:46:41.000Z',
      stop: '2021-11-13T09:31:41.000Z',
      title: 'Le cercle',
      icon: 'https://service.canal-overseas.com/image-api/v1/image/2a311987c642d97485d5f531e698dfb7'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"currentPage":{"displayTemplate":"error","BOName":"Page introuvable"},"title":"Page introuvable","text":"La page que vous demandez est introuvable. Si le problème persiste, vous pouvez contacter l'assistance de CANAL+/CANALSAT.","code":404}`
  })
  expect(result).toMatchObject([])
})
