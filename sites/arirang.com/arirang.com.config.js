const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
    site: 'arirang.com',
    output: 'arirang.com.guide.xml',
    channels: 'arirang.com.channels.xml',
    lang: 'en',
    days: 7,
    delay: 5000,
    url: 'https://www.arirang.com/v1.0/open/external/proxy',

    request: {
        method: 'POST',
        timeout: 5000,
        cache: { ttl: 60 * 60 * 1000 },
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Origin': 'https://www.arirang.com',
            'Referer': 'https://www.arirang.com/schedule',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
        },
        data: function (context) {
            const { channel, date } = context
            return {
                'address': 'https://script.arirang.com/api/v1/bis/listScheduleV3.do',
                'method': 'POST',
                'headers': {},
                'body': {
                    'data': {
                        'dmParam': {
                            'chanId': channel.site_id,
                            'broadYmd': dayjs.tz(date, 'Asia/Seoul').format('YYYYMMDD'),
                            'planNo': '1'
                        }
                    }
                }
            }
        }
    },

    logo: function (context) {
        return context.channel.logo
    },

    async parser(context) {
        const programs = []
        const items = parseItems(context.content)

        for (let item of items) {
            const programDetail = await parseProgramDetail(item)

            programs.push({
                title: item.displayNm,
                start: parseStart(item),
                stop: parseStop(item),
                icon: parseIcon(programDetail),
                category: parseCategory(programDetail),
                description: parseDescription(programDetail)
            })
        }

        return programs
    }
}

function parseItems(content) {
    if (content != '') {
        const data = JSON.parse(content)
        return (!data || !data.responseBody || !Array.isArray(data.responseBody.dsSchWeek)) ? [] : data.responseBody.dsSchWeek
    } else {
        return []
    }
}

function parseStart(item) {
    return dayjs.tz(item.broadYmd + ' ' + item.broadHm, 'YYYYMMDD HHmm', 'Asia/Seoul')
}

function parseStop(item) {
    return dayjs.tz(item.broadYmd + ' ' + item.broadHm, 'YYYYMMDD HHmm', 'Asia/Seoul').add(item.broadRun, 'minute')
}

async function parseProgramDetail(item) {
    return axios.post(
        'https://www.arirang.com/v1.0/open/program/detail',
        {
            'bis_program_code': item.pgmCd
        },
        {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Origin': 'https://www.arirang.com',
                'Referer': 'https://www.arirang.com/schedule',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
            },
            timeout: 5000,
            cache: { ttl: 60 * 1000 },
        }
    ).then(function (response) {
        return response.data
    }).catch(function (error) {
        // console.log(error)
    })
}

function parseIcon(programDetail) {
    if (programDetail && programDetail.image && programDetail.image[0].url) {
        return programDetail.image[0].url
    } else {
        return ''
    }
}

function parseCategory(programDetail) {
    if (programDetail && programDetail.category_Info && programDetail.category_Info[0].title) {
        return programDetail.category_Info[0].title
    } else {
        return ''
    }
}

function parseDescription(programDetail) {
    if (programDetail && programDetail.content && programDetail.content[0] && programDetail.content[0].text) {
        let description = programDetail.content[0].text
        let regex = /(<([^>]+)>)/ig
        return description.replace(regex, '')
    } else {
        return ''
    }
}
