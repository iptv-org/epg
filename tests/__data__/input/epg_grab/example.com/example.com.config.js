module.exports = {
  site: 'example.com',
  days: 2,
  request: {
    timeout: 1000
  },
  url: 'https://example.com',
  parser({ channel, date }) {
    if (channel.xmltv_id === 'Channel2.us') return []
    else if (channel.xmltv_id === 'Channel1.us' && channel.lang === 'fr') {
      return [
        {
          title: 'Programme1 (example.com)',
          start: `${date.format('YYYY-MM-DD')}T04:30:00.000Z`,
          stop: `${date.format('YYYY-MM-DD')}T07:10:00.000Z`
        }
      ]
    }

    return [
      {
        title: 'Program1 (example.com)',
        start: `${date.format('YYYY-MM-DD')}T04:31:00.000Z`,
        stop: `${date.format('YYYY-MM-DD')}T07:10:00.000Z`
      }
    ]
  }
}
