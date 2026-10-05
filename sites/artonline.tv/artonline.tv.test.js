const { parser, url, request } = require('./artonline.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const channel = {
  site_id: '#Aflam2',
  xmltv_id: 'ARTAflam2.sa'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.artonline.tv/Home/TvlistAflam2')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'content-type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data for today', () => {
  const date = dayjs.utc().startOf('d')
  const data = request.data({ date })
  expect(data.get('objId')).toBe('0')
})

it('can generate valid request data for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  const data = request.data({ date })
  expect(data.get('objId')).toBe('1')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-03T21:30:00.000Z',
      stop: '2022-03-03T23:04:00.000Z',
      title: 'الراقصه و السياسي',
      description:
        'تقرر الراقصه سونيا انشاء دار حضانه للأطفال اليتامى و عندما تتقدم بمشورعها للمسئول يرفض فتتحداه ، تلجأ للوزير عبد الحميد رأفت تربطه بها علاقة قديمة ، يخشى على مركزه و يرفض مساعدتها فتقرر كتابة مذكراتها بمساعدة أحد الصحفيين ، يتخوف عبد الحميد و المسئولين ثم يفاجأ عبد الحميد بحصول سونيا على الموافقه للمشورع و البدء في تنفيذه و ذلك لعلاقتها بأحد كبار المسئولين .',
      image: 'https://www.artonline.tv/UploadImages/Channel/ARTAFLAM1/03/AlRaqesaWaAlSeyasi.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: ''
  })
  expect(result).toMatchObject([])
})
