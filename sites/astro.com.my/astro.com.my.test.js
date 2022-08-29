const { parser, url } = require('./astro.com.my.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

// const date = dayjs.utc('2022-08-29', 'YYYY-MM-DD').startOf('d')
const channel = {
    site_id: '235',
    xmltv_id: 'AstroArena.my'
}

it('can generate valid url', () => {
    expect(url({ channel })).toBe(
        'https://contenthub-api.eco.astro.com.my/channel/235.json'
    )
})

it('can parse response', () => {
    const content = `{"responseCode":200,"responseMessage":"Channel Detail","response":{"schedule":{"2022-08-29":[{"eventId":"40182037","title":"Motor: Cub Prix 2022","programmeId":"KAEQR","episodeId":"KAEQY","datetime":"2022-08-29 00:15:00.0","datetimeInUtc":"2022-08-28 16:15:00.0","duration":"02:25:00","siTrafficKey":"1:10000285:47439431","detailUrl":"/details/Motor-Cub-Prix-2022-1:10000285:47439431"}],"2022-08-30":[{"eventId":"40197573","title":"BWF Kejohanan Dunia 2022","programmeId":"KAGFN","episodeId":"KDGUX","datetime":"2022-08-30 00:00:00.0","datetimeInUtc":"2022-08-29 16:00:00.0","duration":"05:15:00","siTrafficKey":"1:10000285:47489961","detailUrl":"/details/BWF-Kejohanan-Dunia-2022-1:10000285:47489961"}]}}}`
    const result = parser({ content }).map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
    })


    expect(result).toMatchObject([
        {
            start: '2022-08-28T16:15:00.000Z',
            stop: '2022-08-28T18:40:00.000Z',
            title: 'Motor: Cub Prix 2022',
        },
        {
            start: '2022-08-29T16:00:00.000Z',
            stop: '2022-08-29T21:15:00.000Z',
            title: 'BWF Kejohanan Dunia 2022',
        }
    ])
})