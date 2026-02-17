const { parser, url } = require('./nostv.pt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-12-11').startOf('d')
const channel = {
  site_id: '510',
  xmltv_id: 'SPlus.pt'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.clg.nos.pt/nostv/ott/schedule/range/contents/guest?channels=510&minDate=2023-12-11T00:00:00Z&maxDate=2023-12-11T23:59:59Z&isDateInclusive=true&client_id=xe1dgrShwdR1DVOKGmsj8Ut4QLlGyOFI'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/data.json'))
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2026-01-23T22:39:00.000Z',
    stop: '2026-01-24T00:23:00.000Z',
    title: 'Em Casa d\'Amália',
    description: 'Que mais poderíamos pedir para o regresso deste programa, do que receber um dos poetas de Amália? Manuel Alegre, autor do icónico "Trova do Vento que Passa", estará connosco. A este raro momento, juntam-se também ilustres convidados: Paulo de Carvalho e o seu filho Agir, Rita Guerra e André Amaro...',
    season: 9,
    episode: 15,
    icon: {
      src: 'https://mage.stream.nos.pt/mage/v1/Images?sourceUri=http://vip.pam.local.internal/PAM.Images/Store/901d96a8f1534749b076212c296d821e&profile=ott_1_452x340&client_id=xe1dgrShwdR1DVOKGmsj8Ut4QLlGyOFI'
    },
    image: 'https://mage.stream.nos.pt/mage/v1/Images?sourceUri=http://vip.pam.local.internal/PAM.Images/Store/901d96a8f1534749b076212c296d821e&profile=ott_1_452x340&client_id=xe1dgrShwdR1DVOKGmsj8Ut4QLlGyOFI'
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    date,
    content: '[]'
  })

  expect(results).toMatchObject([])
})
