// npx epg-grabber --config=sites/m.tv.sms.cz/m.tv.sms.cz.config.js --channels=sites/m.tv.sms.cz/m.tv.sms.cz_cz.channels.xml --output=.gh-pages/guides/cz/m.tv.sms.cz.epg.xml --days=2

const { parser, url, logo } = require('./m.tv.sms.cz.config.js')
const iconv = require('iconv-lite')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'Cero',
  xmltv_id: '0.es'
}
const content = `<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd"><html xmlns="http://www.w3.org/1999/xhtml"> <head></head> <body> <div id="obsah" style="text-align: left"> <div class="stanice" style="text-align: left"> <div class="stanice_a" style="border-bottom: none"> <div style="width: 50%; float: left; overflow: hidden; height: 2.8em; padding-top: 5px"> <div class="button" style="width: 90%; margin-left: 3px; text-align: left; overflow: hidden" onclick="zmen_stanici(this)" > <img style="float: right; margin-top: 10px; margin-right: 3px" src="//www.sms.cz/mobilni/tvp/img/sipka_dolu.gif"/> <div class="logo_out" onclick="zmen_stanici(this); canEv(event);"> <img style="margin-top: 2px" class="logo" src="//www.sms.cz/kategorie/televize/bmp/loga/velka/cero.png"/> </div><div class="button_ov"> Cero <div class="ztrb"></div></div></div></div><div style="width: 50%; float: left; margin-top: 5px"> <div style="width: 50%; float: right"> <a href="#" onclick="zobraz_datepicker()" class="button" style="width: 90%; float: right; margin-right: 3px" > <img style="float: right; margin-top: 10px; margin-right: 3px" src="//www.sms.cz/mobilni/tvp/img/sipka_dolu.gif"/>dnes</a > </div><div style="width: 50%; float: left"> <a href="#" class="button" onclick="zobraz_timepicker(this)" style="width: 90%"> <img style="float: right; margin-top: 10px; margin-right: 3px" src="//www.sms.cz/mobilni/tvp/img/sipka_dolu.gif"/> <span id="time_text">rбno</span> </a> </div></div></div><div class="porady"> <div class="porad"> <div class="cas" onclick='if (document.getElementById("x1581482663")) document.getElementById("x1581482663").click();' > <span style="">05.02</span><br/> </div><a class="nazev" href="https://m.tv.sms.cz/televize/Cero/20211124/1581482663-La-magia-de-la-Luna--El-octavo-continente" ><div style="position: relative; overflow: hidden; height: 18px"> La magia de la Luna: El octavo continente <div class="ztr"></div></div><div class="detail"> Documentales <div class="ztr"></div></div ></a> </div><div class="porad"> <div class="cas" onclick='if (document.getElementById("x1581482664")) document.getElementById("x1581482664").click();' > <span style="">05.56</span><br/> </div><a class="nazev" href="https://m.tv.sms.cz/televize/Cero/20211124/1581482664-Explorando-Europa--El-nacimiento-de-un-continente" ><div style="position: relative; overflow: hidden; height: 18px"> Explorando Europa: El nacimiento de un continente <div class="ztr"></div></div><div class="detail"> Documentales <div class="ztr"></div></div ></a> </div><div class="porad"> <div class="cas" onclick='if (document.getElementById("x1580526747")) document.getElementById("x1580526747").click();' > <span style="">23.00</span><br/> </div><a class="nazev" href="https://m.tv.sms.cz/televize/Cero/20211124/1580526747-Late-Motiv--41-" ><div style="position: relative; overflow: hidden; height: 18px"> Late Motiv (41) <div class="ztr"></div></div><div class="detail"> Entretenimiento <div class="ztr"></div></div ></a> </div><div class="porad"> <div class="cas" onclick='if (document.getElementById("x1580526748")) document.getElementById("x1580526748").click();' > <span style="">00.05</span><br/> </div><a class="nazev" href="https://m.tv.sms.cz/televize/Cero/20211124/1580526748-La-Resistencia--41-" ><div style="position: relative; overflow: hidden; height: 18px"> La Resistencia (41) <div class="ztr"></div></div><div class="detail"> Entretenimiento <div class="ztr"></div></div ></a> </div><div class="porad"> <div class="cas" onclick='if (document.getElementById("x1581426545")) document.getElementById("x1581426545").click();' > <span style="">01.20</span><br/> </div><a class="nazev" href="https://m.tv.sms.cz/televize/Cero/20211124/1581426545-Ilustres-Ignorantes--Cantantes" ><div style="position: relative; overflow: hidden; height: 18px"> Ilustres Ignorantes: Cantantes <div class="ztr"></div></div><div class="detail"> Entretenimiento <div class="ztr"></div></div ></a> </div></div></div></div></body></html>`
const buffer = iconv.encode(Buffer.from(content), 'win1250')

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://m.tv.sms.cz/index.php?stanice=Cero&cas=0&den=2021-11-24'
  )
})

it('can generate valid logo url', () => {
  expect(logo({ content })).toBe('https://www.sms.cz/kategorie/televize/bmp/loga/velka/cero.png')
})

it('can parse response', () => {
  const result = parser({ buffer, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T04:02:00.000Z',
      stop: '2021-11-24T04:56:00.000Z',
      title: `La magia de la Luna: El octavo continente`,
      description: 'Documentales'
    },
    {
      start: '2021-11-24T04:56:00.000Z',
      stop: '2021-11-24T22:00:00.000Z',
      title: `Explorando Europa: El nacimiento de un continente`,
      description: 'Documentales'
    },
    {
      start: '2021-11-24T22:00:00.000Z',
      stop: '2021-11-24T23:05:00.000Z',
      title: `Late Motiv (41)`,
      description: 'Entretenimiento'
    },
    {
      start: '2021-11-24T23:05:00.000Z',
      stop: '2021-11-25T00:20:00.000Z',
      title: `La Resistencia (41)`,
      description: 'Entretenimiento'
    },
    {
      start: '2021-11-25T00:20:00.000Z',
      stop: '2021-11-25T01:20:00.000Z',
      title: `Ilustres Ignorantes: Cantantes`,
      description: 'Entretenimiento'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    buffer: iconv.encode(
      Buffer.from(
        `<!DOCTYPE html><html><head></head><body><textarea data-jtrt-table-id="508" id="jtrt_table_settings_508" cols="30" rows="10"></textarea></body></html>`
      ),
      'win1250'
    )
  })
  expect(result).toMatchObject([])
})
