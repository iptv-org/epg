// npx epg-grabber --config=sites/zap.co.ao/zap.co.ao.config.js --channels=sites/zap.co.ao/zap.co.ao.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./zap.co.ao.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '78',
  xmltv_id: '24KitchenPortugal.pt'
}
const content = `[{"image_uri":"https://www.zap.co.ao/media/cache/movie_thumb/uploads/ao/channels/54bd3c6b068ef.png","id":78,"identifier":"24KITCHEN","name":"24Kitchen","number":84,"theme":"Outros / Entretenimento / Tem\\u00e1ticos","language":"Portugu\\u00eas","site":"www.24kitchen.pt","description":"Com Jamie Oliver e Gordon Ramsay no comando, este canal de renome internacional traz para junto de si os melhores chefs de cozinha do mundo em portugu\\u00eas.","epg":[{"start_seconds":4680,"id":51296648,"identifier":"P9FGQ7","name":"Filipa Gomes Cozinha Com Twist T.2 Ep.22","subtitle":"","sinopse":"Ano: 2017 Com: Filipa Gomes \\nWorkout.\\nHoje em dia h\\u00e1 imensa gente que faz do desporto um mantra! \\u00c9 a pensar nessas pessoas que apresentamos tr\\u00eas receitas ideais para comer antes ou depois do treino.","date":"2021-11-25T00:00:00+0000","start_time":"01h18","end_time":"01h46","duration":1680},{"start_seconds":85440,"id":51296700,"identifier":"P9FX4J","name":"MasterChef USA T.11 Ep.17","subtitle":"","sinopse":"Finale - Curtis Stone.\\nO famoso chef Curtis Stone est\\u00e1 de volta como jurado convidado para as semifinais quando o Top Tr\\u00eas luta por um lugar na final na ronda de aperitivos.","date":"2021-11-25T00:00:00+0000","start_time":"23h44","end_time":"00h26","duration":2520},{"start_seconds":1560,"id":51296701,"identifier":"P9FX4K","name":"Prato do Dia T.2 Ep.9","subtitle":"","sinopse":"Ano: 2013 Com: Filipa Gomes \\nO sabor de um bom queijo caprese faz companhia ao presunto numas espetadas que abrem o apetite para uma salada onde um tenro naco da vazia \\u00e9 o destaque principal. E \\u00e0 espera est\\u00e1 ainda um cheesecake carregado do sabor \\u00fanico das cerejas do Fund\\u00e3o.","date":"2021-11-25T00:00:00+0000","start_time":"00h26","end_time":"00h51","duration":1500},{"start_seconds":3060,"id":51296702,"identifier":"P9FX4L","name":"Prato do Dia T.2 Ep.10","subtitle":"","sinopse":"Ano: 2013 Com: Filipa Gomes \\nUm bom prato de carac\\u00f3is anuncia uma grande tarde de petiscos. Segue-se uma salada fria com a textura das favas e o sabor da entremeada, e termina com um crocante caramelo de amendoim, sem que termine a boa disposi\\u00e7\\u00e3o.","date":"2021-11-25T00:00:00+0000","start_time":"00h51","end_time":"01h17","duration":1560}]},{"image_uri":"https://www.zap.co.ao/media/cache/movie_thumb/uploads/ao/channels/57a081f87891b.png","id":79,"identifier":"FOODNW","name":"Food Network","number":85,"theme":"Outros / Entretenimento / Tem\\u00e1ticos","language":"Portugu\\u00eas","site":"http://www.foodnetwork.com/","description":"Um canal onde o mundo da cozinha \\u00e9 explorado a todos os n\\u00edveis, em Alta Defini\\u00e7\\u00e3o. Aqui poder\\u00e1 encontrar novas e diferentes t\\u00e9cnicas de abordar os alimentos, cultura pop, viagens e competi\\u00e7\\u00f5es.","epg":[{"start_seconds":3600,"id":51302141,"identifier":"P9FHFQ","name":"Guy's Grocery Games T.5 Ep.8","subtitle":"","sinopse":"Ano: 2015 De: J. Rupert Thompson Com: Guy Fieri, Troy Johnson, Melissa d'Arabian \\nIMDB\\u00ae 6,6/10\\nThrillin' Grillin'.\\nGuy Fieri re\\u00fane quatro chefs com talento numa competi\\u00e7\\u00e3o dura e dif\\u00edcil entre as filas de produtos do supermercado.","date":"2021-11-25T00:00:00+0000","start_time":"01h00","end_time":"01h40","duration":2400}]}]`

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://www.zap.co.ao/_api/channels/2021-11-25/epg.json')
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-25T00:18:00.000Z',
      stop: '2021-11-25T00:46:00.000Z',
      title: `Filipa Gomes Cozinha Com Twist T.2 Ep.22`,
      description:
        'Ano: 2017 Com: Filipa Gomes \nWorkout.\nHoje em dia há imensa gente que faz do desporto um mantra! É a pensar nessas pessoas que apresentamos três receitas ideais para comer antes ou depois do treino.'
    },
    {
      start: '2021-11-25T22:44:00.000Z',
      stop: '2021-11-25T23:26:00.000Z',
      title: `MasterChef USA T.11 Ep.17`,
      description:
        'Finale - Curtis Stone.\nO famoso chef Curtis Stone está de volta como jurado convidado para as semifinais quando o Top Três luta por um lugar na final na ronda de aperitivos.'
    },
    {
      start: '2021-11-25T23:26:00.000Z',
      stop: '2021-11-25T23:51:00.000Z',
      title: `Prato do Dia T.2 Ep.9`,
      description:
        'Ano: 2013 Com: Filipa Gomes \nO sabor de um bom queijo caprese faz companhia ao presunto numas espetadas que abrem o apetite para uma salada onde um tenro naco da vazia é o destaque principal. E à espera está ainda um cheesecake carregado do sabor único das cerejas do Fundão.'
    },
    {
      start: '2021-11-25T23:51:00.000Z',
      stop: '2021-11-26T00:17:00.000Z',
      title: `Prato do Dia T.2 Ep.10`,
      description:
        'Ano: 2013 Com: Filipa Gomes \nUm bom prato de caracóis anuncia uma grande tarde de petiscos. Segue-se uma salada fria com a textura das favas e o sabor da entremeada, e termina com um crocante caramelo de amendoim, sem que termine a boa disposição.'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `[]`
  })
  expect(result).toMatchObject([])
})
