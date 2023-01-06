// npx epg-grabber --config=sites/m.tv.sms.cz/m.tv.sms.cz.config.js --channels=sites/m.tv.sms.cz/m.tv.sms.cz.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./m.tv.sms.cz.config.js')
const iconv = require('iconv-lite')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'Cero',
  xmltv_id: '0.es'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://m.tv.sms.cz/index.php?stanice=Cero&cas=0&den=2022-03-30'
  )
})

it('can parse response', () => {
  let content = `<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.0//EN" "http://www.wapforum.org/DTD/xhtml-mobile10.dtd"><html xmlns="http://www.w3.org/1999/xhtml"> <head></head> <body> <div id='obsah' style='text-align: left'> <div class='stanice' style='text-align: left'> <div class='porady'> <div class='porad' style='display: none;'> <div class='cas' onclick='if (document.getElementById("x1620166884")) document.getElementById("x1620166884").click();'><span style='color: #FF2672'>05.25</span><br/></div><a class='nazev' href='https://m.sms.cz/serial/pred-kamerou-xix-8'> <div style='position: relative; overflow: hidden; height: 18px;'> Před kamerou XIX (8) <div class='ztr'></div></div><div class='detail'> Filmový magazín Francie / USA (2022) <div class='ztr'></div></div></a> </div><div class='porad' style='display: none;'> <div class='cas' onclick='if (document.getElementById("x1620166885")) document.getElementById("x1620166885").click();'><span style='color: #71B7DC'>06.00</span><br/><span style='color: #71B7DC; font-size: 85%'>59%</span></div><a class='nazev' href='https://m.sms.cz/film/kubanska-spojka'> <div style='position: relative; overflow: hidden; height: 18px;'> Kubánská spojka <div class='ztr'></div></div><div class='detail'> Na přelomu 80. a 90. let minulého století podnikaly povstalecké skupiny sídlící na Floridě násilné ú... <div class='ztr'></div></div></a> </div><div class='porad' > <div class='cas' onclick='if (document.getElementById("x1620166899")) document.getElementById("x1620166899").click();'> <span style='color: #71B7DC'>22.35</span><br/><span style='color: #71B7DC; font-size: 85%'>72%</span><br/> <div id="x1620166899" title="Přehrát televizní pořad" class="ntvp_rec " style="width: 90%; max-width: initial !important;" onclick="location.href='https://www.xn--lep-tma39c.tv/'" > <div class="record_cudl_inner"></div></div></div><a class='nazev' href='https://m.sms.cz/film/patriot-2000'> <div style='position: relative; overflow: hidden; height: 18px;'> Patriot <div class='ztr'></div></div><div class='detail'> Jižní Karolína, 1776. Benjamin Martin, hrdina, který bojoval proti Francouzům a Indiánům, žije v kli... <div class='ztr'></div></div></a> </div><div class='porad' > <div class='cas' onclick='if (document.getElementById("x1620166900")) document.getElementById("x1620166900").click();'> <span style='color: #71B7DC'>01.15</span><br/><span style='color: #71B7DC; font-size: 85%'>55%</span><br/> <div id="x1620166900" title="Přehrát televizní pořad" class="ntvp_rec " style="width: 90%; max-width: initial !important;" onclick="location.href='https://www.xn--lep-tma39c.tv/'" > <div class="record_cudl_inner"></div></div></div><a class='nazev' href='https://m.sms.cz/film/chelsea-handler-evoluce'> <div style='position: relative; overflow: hidden; height: 18px;'> Chelsea Handler: Evoluce <div class='ztr'></div></div><div class='detail'> Chelsea Handlerová se po šestileté přestávce vrací ke stand-up comedy ve speciálu HBO Max. Během hod... <div class='ztr'></div></div></a> </div><div class='porad' > <div class='cas' onclick='if (document.getElementById("x1620166901")) document.getElementById("x1620166901").click();'> <span style='color: #FF2672'>02.25</span><br/> <div id="x1620166901" title="Přehrát televizní pořad" class="ntvp_rec " style="width: 90%; max-width: initial !important;" onclick="location.href='https://www.xn--lep-tma39c.tv/'" > <div class="record_cudl_inner"></div></div></div><a class='nazev' href='https://m.sms.cz/serial/drapy-episode-7'> <div style='position: relative; overflow: hidden; height: 18px;'> Drápy IV (8) <div class='ztr'></div></div><div class='detail'> Kriminální komediální drama USA (2020) <div class='ztr'></div></div></a> </div></div></div></div></body></html>`
  const buffer = iconv.encode(content, 'win1250')
  const result = parser({ content, buffer, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-30T03:25:00.000Z',
      stop: '2022-03-30T04:00:00.000Z',
      title: `Před kamerou XIX (8)`,
      description: 'Filmový magazín Francie / USA (2022)'
    },
    {
      start: '2022-03-30T04:00:00.000Z',
      stop: '2022-03-30T20:35:00.000Z',
      title: `Kubánská spojka`,
      description:
        'Na přelomu 80. a 90. let minulého století podnikaly povstalecké skupiny sídlící na Floridě násilné ú...'
    },
    {
      start: '2022-03-30T20:35:00.000Z',
      stop: '2022-03-30T23:15:00.000Z',
      title: `Patriot`,
      description:
        'Jižní Karolína, 1776. Benjamin Martin, hrdina, který bojoval proti Francouzům a Indiánům, žije v kli...'
    },
    {
      start: '2022-03-30T23:15:00.000Z',
      stop: '2022-03-31T00:25:00.000Z',
      title: `Chelsea Handler: Evoluce`,
      description:
        'Chelsea Handlerová se po šestileté přestávce vrací ke stand-up comedy ve speciálu HBO Max. Během hod...'
    },
    {
      start: '2022-03-31T00:25:00.000Z',
      stop: '2022-03-31T01:25:00.000Z',
      title: `Drápy IV (8)`,
      description: 'Kriminální komediální drama USA (2020)'
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
