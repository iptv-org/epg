module.exports = {
  lang: 'tr',
  site: 'digiturk.com.tr',
  channels: 'digiturk.com.tr.channels.xml',
  output: '.gh-pages/guides/digiturk.com.tr.guide.xml',
  url: function ({ date, channel }) {
    return `https://www.digiturk.com.tr/yayin-akisi/api/program/kanal/${
      channel.site_id
    }/${date.format('YYYY-MM-DD')}/0`
  },
  parser: function ({ content, date, channel }) {
    const programs = []
    const data = content.listings[channel.site_id]
    if (!data) return programs

    const categories = {
      '00': 'Diğer',
      E0: 'Romantik Komedi',
      E1: 'Aksiyon',
      E4: 'Macera',
      E5: 'Dram',
      E6: 'Fantastik',
      E7: 'Komedi',
      E8: 'Korku',
      EB: 'Polisiye',
      EF: 'Western',
      FA: 'Macera',
      FB: 'Yarışma',
      FC: 'Eğlence',
      F0: 'Reality-Show',
      F2: 'Haberler',
      F4: 'Belgesel',
      F6: 'Eğitim',
      F7: 'Sanat ve Kültür',
      F9: 'Life Style'
    }

    data.forEach(item => {
      if (item.ProgramName && item.BroadcastStart && item.BroadcastEnd) {
        programs.push({
          title: item.ProgramName,
          description: item.LongDescription,
          category: categories[item.Genre],
          start: item.BroadcastStart,
          stop: item.BroadcastEnd
        })
      }
    })

    return programs
  }
}
