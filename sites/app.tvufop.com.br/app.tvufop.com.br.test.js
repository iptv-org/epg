
const { parser, url } = require('./app.tvufop.com.br.config.js')

const dayjs = require('dayjs')

const utc = require('dayjs/plugin/utc')

const customParseFormat = require('dayjs/plugin/customParseFormat')



dayjs.extend(utc)

dayjs.extend(customParseFormat)



const date = dayjs.utc('2026-03-28', 'YYYY-MM-DD').startOf('d')

const channel = {

  site_id: 'TVUFOP.br@HD',

  xmltv_id: 'TVUFOP.br@HD',

  lang: 'pt'

}



it('can generate valid url', () => {

  expect(url({ channel, date })).toBe('https://app.tvufop.com.br/epg/epg_tvufop_web.xml')

})



it('can parse response', () => {

  const content = `<?xml version="1.0" encoding="UTF-8"?>

  <tv>

    <channel id="TVUFOP.br@HD">

      <display-name lang="pt-BR">TV UFOP</display-name>

    </channel>

    <programme start="20260328000001 -0300" stop="20260328001322 -0300" channel="TVUFOP.br@HD">

      <title lang="pt-BR">(FUTURA) CANAL DA HISTÓRIA - CARMEN MIRANDA</title>

      <desc lang="pt-BR">Clara e Neto usam uma máquina do tempo.</desc>

      <icon src="https://app.tvufop.com.br/epg/CANAL.jpg" />

      <rating system="DJCTQ"><value>Livre</value></rating>

    </programme>

  </tv>`



  const results = parser({ content, channel, date })



  expect(results.length).toBe(1)

  expect(results[0]).toMatchObject({

    title: '(FUTURA) CANAL DA HISTÓRIA - CARMEN MIRANDA',

    description: 'Clara e Neto usam uma máquina do tempo.',

    icon: 'https://app.tvufop.com.br/epg/CANAL.jpg',

    rating: 'Livre'

  })

})



it('can handle empty guide', () => {

  const results = parser({ content: '', channel, date })

  expect(results).toMatchObject([])

})

