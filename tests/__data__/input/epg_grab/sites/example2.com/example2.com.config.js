module.exports = {
  site: 'example2.com',
  url: 'https://example2.com',
  parser({ channel, date }) {
    if (channel.lang === 'fr') {
      return [
        {
          title: 'Programme1 (example2.com)',
          start: `${date.format('YYYY-MM-DD')}T04:40:00.000Z`,
          stop: `${date.format('YYYY-MM-DD')}T07:10:00.000Z`
        }
      ]
    }

    return [
      {
        title: 'Program1 (example2.com)',
        start: `${date.format('YYYY-MM-DD')}T04:31:00.000Z`,
        stop: `${date.format('YYYY-MM-DD')}T07:10:00.000Z`
      }
    ]
  }
}
