// npx epg-grabber --config=sites/tvgid.ua/tvgid.ua.config.js --channels=sites/tvgid.ua/tvgid.ua.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tvgid.ua.config.js')
const iconv = require('iconv-lite')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1plus1',
  xmltv_id: '1Plus1.ua'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tvgid.ua/channels/1plus1/24112021/tmall/')
})

it('can parse response', () => {
  const content = `<!DOCTYPE html><html> <head><meta http-equiv="Content-Type" content="text/html; charset=windows-1251"></head> <body> <table> <tr> <td style="padding: 0 10px"> <table cellspacing="0" cellpadding="0" width="100%"> <tr> <td> <table width="100%" cellspacing="0" cellpadding="0"> <tr> <td width="100%" style="border-right: 1px solid #ccc" valign="top"> <table cellspacing="0" cellpadding="0" border="0" width="99%" id="container"> <tr> <td> <h1 class="h1small">Телепрограма 1+1 на 24.11.2021</h1> </td></tr><tr> <td> <table cellspacing="0" cellpadding="0" width="100%"> <tr> <td valign="top" style="padding-right: 5px"> <table cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#F0F7FD" > <tr> <td><img src="/i/lt-crn.jpg" width="10" height="10"/></td><td width="100%"> <img src="/i/tp.gif" width="100%" height="1"/> </td><td><img src="/i/rt-crn.jpg" width="10" height="10"/></td></tr></table> <table cellspacing="0" cellpadding="2" border="0" width="100%" bgcolor="#F0F7FD" > <tr> <td colspan="2" style="padding-left: 10px"> <table cellspacing="0" cellpadding="0"> <tr> <td class="title-channel" align="left"> <a href="/channels/1plus1/24112021">1+1</a> </td><td class="poll-in-forum"> <a href="/channels/1plus1/gb/">Обговорити</a>&nbsp;<a >(917)</a > </td></tr></table> </td></tr><tr> <td colspan="2" style="padding-left: 10px"> <table cellspacing="0" cellpadding="0"> <tr> <td class="time">06:30</td><td class="item"> <a href="/entertainment/10170/snidanok-z-1-1/" >&quot;Сніданок з 1+1&quot;</a >&nbsp;<img src="/i/stars/3o5.gif" width="56" height="10" valign="absmiddle"/> </td></tr></table> </td></tr><tr> <td colspan="2" style="padding-left: 10px"> <table cellspacing="0" cellpadding="0"> <tr> <td class="time">00:35</td><td class="item">Х/ф &quot;Біля моря&quot;</td></tr></table> </td></tr><tr> <td colspan="2" style="padding-left: 10px"> <table cellspacing="0" cellpadding="0"> <tr> <td class="time">03:00</td><td class="item"> <a href="/entertainment/303513/gudnajtklab/" >&quot;#Гуднайт_клаб&quot;</a >&nbsp;<img src="/i/stars/45o5.gif" width="56" height="10" valign="absmiddle"/> </td></tr></table> </td></tr></table> </td></tr></table> </td></tr></table> </td></tr></table> </td></tr></table> </td></tr></table> </body></html>`
  const buffer = iconv.encode(Buffer.from(content), 'win1251')
  const result = parser({ buffer, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T04:30:00.000Z',
      stop: '2021-11-24T22:35:00.000Z',
      title: `"Сніданок з 1+1"`
    },
    {
      start: '2021-11-24T22:35:00.000Z',
      stop: '2021-11-25T01:00:00.000Z',
      title: `Х/ф "Біля моря"`
    },
    {
      start: '2021-11-25T01:00:00.000Z',
      stop: '2021-11-25T02:00:00.000Z',
      title: `"#Гуднайт_клаб"`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body><textarea data-jtrt-table-id="508" id="jtrt_table_settings_508" cols="30" rows="10"></textarea></body></html>`
  })
  expect(result).toMatchObject([])
})
