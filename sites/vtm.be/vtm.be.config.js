const dayjs = require('dayjs')
const isBetween = require('dayjs/plugin/isBetween')

dayjs.extend(isBetween)

module.exports = {
  site: 'vtm.be',
  days: 2,
  url: function ({ channel }) {
    return `https://vtm.be/tv-gids/${channel.site_id}`
  },
  request: {
    headers: {
      Cookie:
        'ak_bmsc=8103DDA2C2C37ECD922124463C746A4C~000000000000000000000000000000~YAAQNwVJF7ndI+p8AQAAYDkcCg0mQAkQ2jDHjSfnXl9VIGnzditECZ1FDj1Yi72a8rv/Q454lDDY0Dm3TPqxJUuNLzxJGmgkLmei4IIIwzKJWbB6wC/FMQApoI1NbGz+tUErryic1HWdbZ2dz1IX+AkOHJ9RVupYG5GmkSEQdFG1+/dSZoBMWEeb/5VOCLmNXRDP7k8LnSXaIuKqp5c2MQB+uQ9DdHUd6bIje3dzuxbka9+nJZ+eX/pNbgWI41X2tiXLvPZKh91Tk9k98zrK0pwBnGpTJqDVxmafYH/CjkXoLgEUW3loZfgL9SqddG706a4LnRPhyLzW6W6SH7Q0QOFE4g54NKADVttS2gbXgVrICvo0bb0FAESaFjc5uDyOd+fV2XBGzw==; authId=54da9bc2-d387-4923-8773-3d33ec68710e; gtm_session=1; _sp_ses.417f=*; _ga=GA1.2.525677035.1636552212; _gid=GA1.2.386833723.1636552212; tcf20_purposes=functional|analytics|targeted_advertising|non-personalised_ads|personalisation|marketing|social_media|advertising_1|advertising_2|advertising_3|advertising_4|advertising_7|advertising_9|advertising_10; _gcl_au=1.1.112810754.1636552212; _gat_UA-538372-57=1; sp=4a32f074-5526-4654-9389-2516d799ec68; _gat_UA-6602938-21=1; _sp_id.417f=0c81a857-09dc-47c2-8e51-4fed976211c4.1636552212.1.1636552214.1636552212.55934f90-4bad-47ff-8c5e-cf904126dcfb; bm_sv=1A45EF31D80D05B688C17EAD85964E29~hFpINNxpFphfJ2LLPoLQTauvUpyAf3kaTeGZAMfI/UTMlTRFjoAGBQJPEUPvSw3rXw/swqqAICc74l56pEBVSw6aJYqaoRaiRAZXyWZzQ6jAoeP5SMsZwtvNzYQ3aJXVWM8W8a98J0trlnSjIIsRPQ=='
    }
  },
  parser: function ({ content, date }) {
    let programs = []
    const data = parseContent(content)
    const items = parseItems(data, date)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.synopsis,
        category: item.genre,
        icon: item.imageUrl,
        start: dayjs(item.from).toJSON(),
        stop: dayjs(item.to).toJSON()
      })
    })

    return programs
  }
}

function parseContent(content) {
  const [_, json] = content.match(/window.__EPG_REDUX_DATA__=(.*);\n/i) || [null, null]
  const data = JSON.parse(json)

  return data
}

function parseItems(data, date) {
  if (!data || !data.broadcasts) return []

  return Object.values(data.broadcasts).filter(i => dayjs(i.from).isBetween(date, date.add(1, 'd')))
}
