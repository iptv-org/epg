const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  site: 'mediasetinfinity.mediaset.it',
  days: 2,
  url: function ({ date, channel }) {
    // Get the epoch timestamp
    const todayEpoch = date.startOf('day').utc().valueOf();
    // Get the epoch timestamp for the next day
    const nextDayEpoch = date.add(1, 'day').startOf('day').utc().valueOf();
    return `https://api-ott-prod-fe.mediaset.net/PROD/play/feed/allListingFeedEpg/v2.0?byListingTime=${todayEpoch}~${nextDayEpoch}&byCallSign=${channel.site_id}`
  },
  parser: function ({ content, date }) {
    const programs = [];
    const data = JSON.parse(content);

    if (!data.response || !data.response.entries || !data.response.entries[0] || !data.response.entries[0].listings) {
      // If the structure is not as expected, return an empty array
      return programs;
    }

    const listings = data.response.entries[0].listings;

    listings.forEach((listing) => {
      if (listing.program.title && listing.startTime && listing.endTime) {
        const start = parseTime(listing.startTime);
        const stop = parseTime(listing.endTime);

        programs.push({
          title: listing.program.title,
          description: listing.program.description,
          start,
          stop
        });
      }
    });
    return programs;
  }
}

function parseTime(timestamp) {
  return dayjs(timestamp).utc().format('YYYY-MM-DD HH:mm');
}
