const { parser, url } = require('./chada.ma.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

jest.mock('axios')

const mockHtmlContent = `
  <div class="pm0 col-md-8" id="stopfix">
    <h2 class="posts-date">Programmes d'Aujourd'hui</h2>
    <div class="posts-area">
      <h2> <i class="fas fa-circle"></i>00:00 - 09:00</h2>
      <div class="relativeme">
        <a href="https://chada.ma/fr/emissions/bloc-prime-clips/">
          <img class="programthumb" src="https://chada.ma/wp-content/uploads/2023/11/Autres-slides-clips-la-couverture.jpg">
        </a>
      </div>
      <h3>Bloc Prime + Clips</h3>
      <div class="authorbox"></div>
      <div class="ssprogramme row"></div>
    </div>
  </div>
`

it('can generate valid url', () => {
  expect(url()).toBe('https://chada.ma/fr/chada-tv/grille-tv/')
})

it('can parse response', () => {
  const content = mockHtmlContent

  const result = parser({ content }).map(p => {
    p.start = dayjs(p.start).tz('Africa/Casablanca').format('YYYY-MM-DDTHH:mm:ssZ')
    p.stop = dayjs(p.stop).tz('Africa/Casablanca').format('YYYY-MM-DDTHH:mm:ssZ')
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'Bloc Prime + Clips',
      description: 'No description available',
      start: dayjs.tz('00:00', 'HH:mm', 'Africa/Casablanca').format('YYYY-MM-DDTHH:mm:ssZ'),
      stop: dayjs.tz('09:00', 'HH:mm', 'Africa/Casablanca').format('YYYY-MM-DDTHH:mm:ssZ')
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '<div class="pm0 col-md-8" id="stopfix"><div class="posts-area"></div></div>'
  })
  expect(result).toMatchObject([])
})
