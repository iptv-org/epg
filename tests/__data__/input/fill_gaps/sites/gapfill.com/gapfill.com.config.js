module.exports = {
  site: 'gapfill.com',
  url: 'https://gapfill.example.com',
  parser({ channel, date }) {
    switch (channel.xmltv_id) {
      case 'GapLong.us':
        return [
          {
            title: 'Program1 (gapfill.com)',
            start: `${date.format('YYYY-MM-DD')}T04:30:00.000Z`,
            stop: `${date.format('YYYY-MM-DD')}T07:10:00.000Z`
          }
        ]
      case 'GapEmpty.fr':
        return []
      case 'GapMiddle.it':
        return [
          {
            title: 'Program1 (gapfill.com)',
            start: `${date.format('YYYY-MM-DD')}T01:00:00.000Z`,
            stop: `${date.format('YYYY-MM-DD')}T02:00:00.000Z`
          },
          {
            title: 'Program2 (gapfill.com)',
            start: `${date.format('YYYY-MM-DD')}T05:00:00.000Z`,
            stop: `${date.format('YYYY-MM-DD')}T06:00:00.000Z`
          }
        ]
      case 'GapOverlap.de':
        return [
          {
            title: 'Program1 (gapfill.com)',
            start: `${date.format('YYYY-MM-DD')}T01:00:00.000Z`,
            stop: `${date.format('YYYY-MM-DD')}T05:00:00.000Z`
          },
          {
            title: 'Program2 (gapfill.com)',
            start: `${date.format('YYYY-MM-DD')}T04:00:00.000Z`,
            stop: `${date.format('YYYY-MM-DD')}T06:00:00.000Z`
          }
        ]
      case 'GapError.es':
        throw new Error('Parser failure')
      case 'GapFallback.xx':
        return [
          {
            title: 'Program1 (gapfill.com)',
            start: `${date.format('YYYY-MM-DD')}T12:00:00.000Z`,
            stop: `${date.format('YYYY-MM-DD')}T13:00:00.000Z`
          }
        ]
      case 'GapBoundary.de':
        return [
          {
            title: 'Early Program (gapfill.com)',
            start: `${date.format('YYYY-MM-DD')}T00:45:00.000Z`,
            stop: `${date.format('YYYY-MM-DD')}T01:30:00.000Z`
          },
          {
            title: 'Middle Program (gapfill.com)',
            start: `${date.format('YYYY-MM-DD')}T08:00:00.000Z`,
            stop: `${date.format('YYYY-MM-DD')}T11:00:00.000Z`
          },
          {
            title: 'Next Program (gapfill.com)',
            start: `${date.format('YYYY-MM-DD')}T12:00:00.000Z`,
            stop: `${date.format('YYYY-MM-DD')}T13:00:00.000Z`
          }
        ]
      default:
        return []
    }
  }
}
