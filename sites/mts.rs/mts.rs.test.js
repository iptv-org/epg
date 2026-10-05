const { parser, url } = require('./mts.rs.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-23', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'rts_1_hd',
  xmltv_id: 'RTS1HD.rs'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://mts.rs/hybris/ecommerce/b2c/v1/products/search?sort=pozicija-rastuce&searchQueryContext=CHANNEL_PROGRAM&query=:pozicija-rastuce:tip-kanala-radio:TV kanali:channelProgramDates:2025-01-23&pageSize=10000'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(31)
  expect(results[0]).toMatchObject({
    start: '2025-01-22T23:25:00.000Z',
    stop: '2025-01-23T00:15:00.000Z',
    title: 'Jeloustoun',
    category: 'Tv-serijali',
    image:
      'https://mediasb2c.mts.rs/medias/5-72517fcb4505f9d7809814598fed5ce6d84571a1-99415C04AED37264BC49C11115B94633.jpg?context=bWFzdGVyfHJvb3R8Nzc4MjN8aW1hZ2UvanBlZ3xhRFpsTDJoa01pODBOakF6T0RnME9UVTROVEU0TWk4MVh6Y3lOVEUzWm1OaU5EVXdOV1k1WkRjNE1EazRNVFExT1RobVpXUTFZMlUyWkRnME5UY3hZVEZmT1RrME1UVkRNRFJCUlVRek56STJORUpETkRsRE1URXhNVFZDT1RRMk16TXVhbkJufGUwZDIyMWU4MDIxZWVhZjY5MDY0ODQ0YjI5OWVjMGJjMDNlNWI3ZjMwNmE0MjYwMWJlMWQxNGFiMzNlMzU1NDE',
    description:
      'Serija prati život Džona Datona, koga tumači oskarovac Kevin Kostner, koji mora da se bori sa spoljnim i unutrašnjim pretnjama kako bi zaštitio svoju porodicu, ranč i imanje. Smeštena u divlje prostranstvo Montane, serija istražuje složene moralne dileme, borbe za opstanak i porodične sukobe u modernom zapadnom okruženju. Sa prelepim pejzažima i napetim zapletima, Jeloustoun nudi priču o ljubavi, lojalnosti, moći i borbi za očuvanje tradicije. Kevin Kostner nije samo glumac u seriji, već i jedan od producenata. Njegovo bogato iskustvo u filmskoj industriji, uključujući režiju i produkciju, pomoglo je da Jeloustoun bude verodostojan i autentičan prikaz života na ranču. Serija je dobila silne nagrade, a među njima i Zlatni globus za najbolju televizijsku seriju (drama) 2021. godine, dok je Kevin Kostner je osvojio nagradu za Najboljeg glumca u dramskoj televizijskoj seriji, iste godine godine. Nekoliko puta je bila nominovana za nagradu Emi.'
  })
  expect(results[30]).toMatchObject({
    start: '2025-01-23T23:30:00.000Z',
    stop: '2025-01-24T00:20:00.000Z',
    title: 'Jeloustoun',
    category: 'Tv-serijali',
    image:
      'https://mediasb2c.mts.rs/medias/5-72517fcb4505f9d7809814598fed5ce6d84571a1-99415C04AED37264BC49C11115B94633.jpg?context=bWFzdGVyfHJvb3R8Nzc4MjN8aW1hZ2UvanBlZ3xhRFpsTDJoa01pODBOakF6T0RnME9UVTROVEU0TWk4MVh6Y3lOVEUzWm1OaU5EVXdOV1k1WkRjNE1EazRNVFExT1RobVpXUTFZMlUyWkRnME5UY3hZVEZmT1RrME1UVkRNRFJCUlVRek56STJORUpETkRsRE1URXhNVFZDT1RRMk16TXVhbkJufGUwZDIyMWU4MDIxZWVhZjY5MDY0ODQ0YjI5OWVjMGJjMDNlNWI3ZjMwNmE0MjYwMWJlMWQxNGFiMzNlMzU1NDE',
    description:
      'Serija prati život Džona Datona, koga tumači oskarovac Kevin Kostner, koji mora da se bori sa spoljnim i unutrašnjim pretnjama kako bi zaštitio svoju porodicu, ranč i imanje. Smeštena u divlje prostranstvo Montane, serija istražuje složene moralne dileme, borbe za opstanak i porodične sukobe u modernom zapadnom okruženju. Sa prelepim pejzažima i napetim zapletima, Jeloustoun nudi priču o ljubavi, lojalnosti, moći i borbi za očuvanje tradicije. Kevin Kostner nije samo glumac u seriji, već i jedan od producenata. Njegovo bogato iskustvo u filmskoj industriji, uključujući režiju i produkciju, pomoglo je da Jeloustoun bude verodostojan i autentičan prikaz života na ranču. Serija je dobila silne nagrade, a među njima i Zlatni globus za najbolju televizijsku seriju (drama) 2021. godine, dok je Kevin Kostner je osvojio nagradu za Najboljeg glumca u dramskoj televizijskoj seriji, iste godine godine. Nekoliko puta je bila nominovana za nagradu Emi.'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
