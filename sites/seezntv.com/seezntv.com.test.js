// npm run channels:parse -- --config=sites/seezntv.com/seezntv.com.config.js --output=sites/seezntv.com/seezntv.com.channels.xml
// npx epg-grabber --config=sites/seezntv.com/seezntv.com.config.js --channels=sites/seezntv.com/seezntv.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./seezntv.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-04-18', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '285',
  xmltv_id: 'MNet.kr'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe(
    'https://api.seezntv.com/svc/menu/app6/api/epg_proglist?ch_no=285&search_day=1'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'X-DEVICE-TYPE': 'PCWEB',
    'X-DEVICE-MODEL': 'Chrome',
    'X-OS-TYPE': 'Windows',
    'X-OS-VERSION': '11',
    transactionId: '0'
  })
})

it('can parse response', () => {
  const content = `{"data":{"list":[{"rebroad":"Y","onair_yn":"N","program_subname":"","program_name":"%ED%80%B8%EB%8D%A4+2","block_yn":"N","ch_image_list":"http://img.megatvdnp.co.kr/uploads/images/channel_image/imgurl/20150910/OMSMNG_20150910145634780.png","hd":"Y","frequency":"3","ch_image_detail":"http://img.megatvdnp.co.kr/uploads/images/channel_image/imgurl/20150910/OMSMNG_20150910145634780.png","director":"","live_url":"http://menu.megatvdnp.co.kr:38086/app6/api/epg_play?ch_no=27","start_ymd":"20220418","free_yn":"N","service_ch_name":"Mnet","cast":"태연,이용진","ch_image_onair":"http://img.megatvdnp.co.kr/uploads/images/channel_image/imgurl/20150910/OMSMNG_20150910145634780.png","end_time":"00:00","start_time":"21:50","pack_group_id":"MTVBA","rating":"15","program_id":"C315691275285","live":"N"},{"rebroad":"Y","onair_yn":"N","program_subname":"","program_name":"My+Boyfriend+is+Better","block_yn":"N","ch_image_list":"http://img.megatvdnp.co.kr/uploads/images/channel_image/imgurl/20150910/OMSMNG_20150910145634780.png","hd":"Y","frequency":"4","ch_image_detail":"http://img.megatvdnp.co.kr/uploads/images/channel_image/imgurl/20150910/OMSMNG_20150910145634780.png","director":"","live_url":"http://menu.megatvdnp.co.kr:38086/app6/api/epg_play?ch_no=27","start_ymd":"20220419","free_yn":"N","service_ch_name":"Mnet","cast":"","ch_image_onair":"http://img.megatvdnp.co.kr/uploads/images/channel_image/imgurl/20150910/OMSMNG_20150910145634780.png","end_time":"01:50","start_time":"00:00","pack_group_id":"MTVBA","rating":"15","program_id":"C315691277285","live":"N"}]},"meta":{"code":"200"}}`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-04-18T12:50:00.000Z',
      stop: '2022-04-18T15:00:00.000Z',
      title: '퀸덤 2'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"meta":{"error_type":"Non Content","error_message":"클라이언트의 요구를 처리했으나 전송할 데이터가 없음","code":"204"}}`,
    date
  })
  expect(result).toMatchObject([])
})
