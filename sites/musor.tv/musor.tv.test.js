// npm run channels:parse -- --config=./sites/musor.tv/musor.tv.config.js --output=./sites/musor.tv/musor.tv_hu.channels.xml
// npx epg-grabber --config=sites/musor.tv/musor.tv.config.js --channels=sites/musor.tv/musor.tv_hu.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./musor.tv.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'DUNA',
  xmltv_id: 'DunaTV.hu'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://musor.tv/napi/tvmusor/DUNA/2022.03.07')
})

it('can parse response', () => {
  const content = `<!DOCTYPE html><html><head></head><body> <div class="big_content"> <div class="content"> <div class="content_container"> <section> <div class="striped_table striped_table_min_height"> <div class="striped_table_row"> <div class="striped_table_cell_right striped_table_cell_right_padding"> <div class="multicolumn multicolumndayprogarea"> <div class="smartpe_progentry" itemscope itemtype="https://schema.org/BroadcastEvent" title="Tovább a részletes műsorinformációhoz" onclick="clickOn(event,'a_36861422');"> <div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <div class="smartpe_progentry_intable top5"> <div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <time class="smartpe_time" itemprop="startDate" content="2022-03-06GMT23:35:00">00:35</time> </div></div></div></div></div><div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <h3 class="smartpe_progtitle_common smartpe_progtitle" itemprop="name"><a id="a_36861422" href="/tvmusor/Havannai_ejszaka/36861422" target="_blank">Havannai éjszaka</a></h3> </div></div><div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <div class="smartpe_progshortdesc" itemprop="description"> kubai-francia filmdráma,2014 </div></div></div><div class="smartpe_progentryrow"> <div class="smartpe_progentrycell smartpe_screenshot"> <img src="//musor.tv/img/small/143/14373/Labadrugas.jpg" width="174" height="116" class="" alt="tv-műsor kép: Labadrúgás" title="tv-műsor: Labadrúgás"> </div></div><div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <div class="smartpe_progentrylong"> A Havannai éjszaka az első film, amely teljes egészében Kubában forgott és kendőzetlen őszinteséggel beszél egy elveszett generáció minden illúziójáról és csalódottságáról. Amadeo 16 évig nem találkozott legjobb barátaival, fe </div></div></div></div><div class="smartpe_progentry" itemscope itemtype="https://schema.org/BroadcastEvent" title="Tovább a részletes műsorinformációhoz" onclick="clickOn(event,'a_36861419');"> <div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <div class="smartpe_progentry_intable top5"> <div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <time class="smartpe_time" itemprop="startDate" content="2022-03-07GMT01:15:00">02:15</time> </div></div></div></div></div><div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <h3 class="smartpe_progtitle_common smartpe_progtitle" itemprop="name"><a id="a_36861419" href="/tvmusor/A_tengeralattjaro_2018_I_1_/36861419" target="_blank">A tengeralattjáró 2018 I./1.</a></h3> </div></div><div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <div class="smartpe_progshortdesc" itemprop="description"> német tévéfilmsorozat,2018 </div></div></div><div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <img src="/images/etc/pg_16.svg" class="smartpe_rating" width="22" height="22" alt="TV műsor 16 év felettieknek!" title="A TV műsor megtekintése 16 év felettieknek ajánlott!"> <span class="smartpe_hd"><img src="/images/etc/hd_30.png" alt="HD adás" title="A műsor HD minőségben is elérhető!" width="30" height="22"></span> </div></div><div class="smartpe_progentryrow"> <div class="smartpe_progentrycell"> <div class="smartpe_progentrylong"> 8/1.: Új utakonUlrich Wrangel tengeralattjáró-kapitány és emberei összecsapásba keverednek egy amerikai fregatt-tal. Eközben a megszállt Franciaországban az ifjú Klaus Hoffmann kapitány azon igyekszik, hogy méltó legyen apja hírnevé </div></div></div></div></div></div></div></div></section> </div></div></div></body></html>`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-06T23:35:00.000Z',
      stop: '2022-03-07T01:15:00.000Z',
      title: `Havannai éjszaka`,
      icon: 'https://musor.tv/img/small/143/14373/Labadrugas.jpg',
      description:
        'A Havannai éjszaka az első film, amely teljes egészében Kubában forgott és kendőzetlen őszinteséggel beszél egy elveszett generáció minden illúziójáról és csalódottságáról. Amadeo 16 évig nem találkozott legjobb barátaival, fe'
    },
    {
      start: '2022-03-07T01:15:00.000Z',
      stop: '2022-03-07T01:45:00.000Z',
      title: `A tengeralattjáró 2018 I./1.`,
      description:
        '8/1.: Új utakonUlrich Wrangel tengeralattjáró-kapitány és emberei összecsapásba keverednek egy amerikai fregatt-tal. Eközben a megszállt Franciaországban az ifjú Klaus Hoffmann kapitány azon igyekszik, hogy méltó legyen apja hírnevé'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
