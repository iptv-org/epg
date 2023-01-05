// npx epg-grabber --config=sites/tvheute.at/tvheute.at.config.js --channels=sites/tvheute.at/tvheute.at.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tvheute.at.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-08', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'orf1', xmltv_id: 'ORF1.at' }
const content = `
<div class="station-info"> <a href="/orf1-programm/08-11-2021-im-tv"> <img class="logo" src="/images/channels/ORF1--1394099696-01.png" alt="ORF1"/> </a> <div class="info"><p>Das ORF1 Programm mit allen Sendungen live im TV von <a title="tv.orf.at" href="http://tv.orf.at" target="_blank">tv.orf.at</a>. Sie haben eine Sendung verpasst. In der ORF TVthek finden Sie viele Sendungen on demand zum Abruf als online Video und live stream.</p></div></div><div class="list channelpage swipeable" data-group="swipe-list" id="showListContainer"> <div class="section-head time-nav no-margin"> <div class="now"> <h1 class="text">ORF1 heute</h1> <a class="earlier" onclick="paging('/part/channel-shows/partial/skysp2/08-11-2021', 'maincontent')">SKYsp2</a> <a class="later" onclick="paging('/part/channel-shows/partial/orf2/08-11-2021', 'maincontent')">ORF2</a> </div><aside> <div class="text">Wiederholung</div></aside> </div><table class="closeOver"> <thead> <tr> <th style="width:95px;" class="pad station-col">Sender</th> <th style="width:60px;" class="start-col">Zeit</th> <th style="width:60px;" class="end-col"><span class="visible-xxs-inline">Zeit</span></th> <th class="pad title-col">Titel</th> <th style="width:70px;" class="splitter dark pad">Start</th> <th style="width:265px;" class="dark pad">Titel</th> </tr></thead> <tbody><tr> <td class="pad station-col"> <a class="station" href="/orf1-programm/heute-im-tv" style="" title="Programm anzeigen">ORF1</a> <span class="type" style="background-color:#ff00ff">Kids</span> </td><td class="start-col"> <time datetime='2021-11-08 06:00'>06:00</time> <time class="until" datetime='2021-11-08 06:10'>06:10</time> </td><td class="end-col"> <time datetime='2021-11-08 06:00'>06:00</time> <time class="until" datetime='2021-11-08 06:10'>06:10</time> <div class="duration-wrapper" data-start='2021-11-08T06:00:00+01:00' data-stop='2021-11-08T06:10:00+01:00' data-future-text="10&#39;" data-future-class="runtime" title="Laufzeit in Minuten"></div></td><td class="pad relative title-col"> <a class="action-show-info" id="monchhichi-kids_520132493"> <strong title="Monchhichi (Wh.)">Monchhichi<span class="wh"> (Wh.)</span></strong> <span class="sub">ANIMATIONSSERIE Der Streiche-Wettbewerb</span> </a> <div class="info"> <div class="image "> <a href="/orf1-programm/sendung/monchhichi-kids_520132493"> <img data-src-desktop="/images/orf1/monchhichi_kids--1895216560-00.jpg" data-srcset-desktop="/images/orf1/monchhichi_kids--1895216560-00.jpg 1x, /images/orf1/monchhichi_kids--1895216560-01.jpg 2x" data-src-mobile="/images/orf1/monchhichi_kids--1895216560-01.jpg" data-srcset-mobile="/images/orf1/monchhichi_kids--1895216560-01.jpg 1x, /images/orf1/monchhichi_kids--1895216560-02.jpg 2x" data-imgloaded="0" alt="&quot;, &quot;Der Streiche-Wettbewerb.&quot;"/> </a> </div><div class="text"> <div class="description">Roger hat sich Ärger mit Dr. Bellows eingehandelt, der ihn für einen Monat strafversetzen möchte. Einmal mehr hadert Roger mit dem Schicksal, dass er keinen eigenen Flaschengeist besitzt, der ihm aus der Patsche helfen kann. Jeannie schlägt vor, ihm Cousine Marilla zu schicken. Doch Tony ist strikt dagegen. Als ein Zaubererpärchen im exotischen Bühnenoutfit für die Zeit von Rogers Abwesenheit sein Apartment in Untermiete bezieht, glaubt Roger, Jeannie habe ihm ihre Verwandte doch noch gesandt.</div><div class="row"> <div class="col-sm-6"> <a href="/orf1-programm/sendung/monchhichi-kids_520132493" class="btn btn-success">Mehr zur Sendung</a> </div></div></div></div></td></tr><tr> <td class="pad station-col"> <a class="station" href="/orf1-programm/heute-im-tv" style="" title="Programm anzeigen">ORF1</a> <span class="type" style=""></span> </td><td class="start-col"> <time datetime='2021-11-08 18:00'>18:00</time> <time class="until" datetime='2021-11-08 18:10'>18:10</time> </td><td class="end-col"> <time datetime='2021-11-08 18:00'>18:00</time> <time class="until" datetime='2021-11-08 18:10'>18:10</time> <div class="duration-wrapper" data-start='2021-11-08T18:00:00+01:00' data-stop='2021-11-08T18:10:00+01:00' data-future-text="10&#39;" data-future-class="runtime" title="Laufzeit in Minuten"></div></td><td class="pad relative title-col"> <strong title="ZIB 18 ">ZIB 18<span class="wh"></span></strong> <span class="sub">NACHRICHTEN</span> </td><td class="splitter dark pad" style="position: relative;"> <div class="adspace w234h60" style="position: absolute; top: 0px;"></div></td><td class="dark pad"></td></tr></tbody> </table></div>
`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tvheute.at/part/channel-shows/partial/orf1/08-11-2021'
  )
})

it('can parse response', () => {
  expect(parser({ date, channel, content })).toMatchObject([
    {
      start: '2021-11-08T05:00:00.000Z',
      stop: '2021-11-08T05:10:00.000Z',
      title: 'Monchhichi (Wh.)',
      category: 'Kids',
      description:
        'Roger hat sich Ärger mit Dr. Bellows eingehandelt, der ihn für einen Monat strafversetzen möchte. Einmal mehr hadert Roger mit dem Schicksal, dass er keinen eigenen Flaschengeist besitzt, der ihm aus der Patsche helfen kann. Jeannie schlägt vor, ihm Cousine Marilla zu schicken. Doch Tony ist strikt dagegen. Als ein Zaubererpärchen im exotischen Bühnenoutfit für die Zeit von Rogers Abwesenheit sein Apartment in Untermiete bezieht, glaubt Roger, Jeannie habe ihm ihre Verwandte doch noch gesandt.',
      icon: 'https://tvheute.at/images/orf1/monchhichi_kids--1895216560-00.jpg'
    },
    {
      start: '2021-11-08T17:00:00.000Z',
      stop: '2021-11-08T17:10:00.000Z',
      title: 'ZIB 18'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<html><head><title>Object moved</title></head><body>
<h2>Object moved to <a href="/">here</a>.</h2>
</body></html>`
  })
  expect(result).toMatchObject([])
})
