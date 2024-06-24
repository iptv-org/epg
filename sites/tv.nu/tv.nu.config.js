const dayjs = require('dayjs')

module.exports = {
  site: 'tv.nu',
  days: 2,
  url: function ({ channel, date }) {
    return `https://web-api.tv.nu/channels/${channel.site_id}/schedule?date=${date.format(
      'YYYY-MM-DD'
    )}&fullDay=true`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        image: item.imageLandscape,
        category: item.genres,
        season: item.seasonNumber || null,
        episode: item.episodeNumber || null,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')

    // prettier-ignore
    const modules = ['ch-51', 'ch-52', 'ch-60', 'ch-27', 'ch-63', 'ch-65', 'ch-64', 'ch-66', 'ch-67', 'ch-68', 'ch-70', 'ch-88', 'ch-45', 'ch-132', 'ch-30228', 'ch-49', 'ch-53', 'ch-30233', 'ch-55', 'ch-93', 'ch-47', 'ch-4', 'ch-134', 'ch-105', 'ch-104', 'ch-131', 'ch-125', 'ch-126', 'ch-30215', 'ch-151', 'ch-122', 'ch-123', 'ch-124', 'ch-30194', 'ch-101', 'ch-106', 'ch-108', 'ch-107', 'ch-136', 'ch-137', 'ch-140', 'ch-120', 'ch-139', 'ch-74', 'ch-71', 'ch-76', 'ch-33', 'ch-18', 'ch-6', 'ch-30197', 'ch-30152', 'ch-146', 'ch-142', 'ch-128', 'ch-30211', 'ch-46', 'ch-162', 'ch-75', 'ch-119', 'ch-57', 'ch-82', 'ch-21', 'ch-22', 'ch-26', 'ch-145', 'ch-38', 'ch-10', 'ch-23', 'ch-9', 'ch-129', 'ch-69', 'ch-12', 'ch-3', 'ch-7', 'ch-81', 'ch-72', 'ch-2', 'ch-111', 'ch-16', 'ch-43', 'ch-80', 'ch-141', 'ch-143', 'ch-164', 'ch-147', 'ch-58', 'ch-39', 'ch-36', 'ch-15', 'ch-154', 'ch-40', 'ch-159', 'ch-30123', 'ch-30132', 'ch-30130', 'ch-30133', 'ch-30125', 'ch-30127', 'ch-30126', 'ch-30134', 'ch-30128', 'ch-30129', 'ch-30124', 'ch-30138', 'ch-30147', 'ch-30146', 'ch-30145', 'ch-30149', 'ch-30151', 'ch-30150', 'ch-30137', 'ch-30136', 'ch-30139', 'ch-30140', 'ch-30142', 'ch-30141', 'ch-161', 'ch-35', 'ch-34', 'ch-32', 'ch-30', 'ch-54', 'ch-112', 'ch-1', 'ch-86', 'ch-84', 'ch-28', 'ch-25', 'ch-13', 'ch-14', 'ch-11', 'ch-8', 'ch-5', 'ch-20', 'ch-24', 'ch-19', 'ch-30168', 'ch-30175', 'ch-30154', 'ch-30225', 'ch-30178', 'ch-30184', 'ch-30185', 'ch-30186', 'ch-30187', 'ch-30189', 'ch-30191', 'ch-30192', 'ch-30216', 'ch-30193', 'ch-30195', 'ch-30196', 'ch-30200', 'ch-30209', 'ch-30231', 'ch-30213', 'ch-30230', 'ch-30214', 'ch-30226', 'ch-56', 'ch-153', 'ch-148', 'ch-41', 'ch-37', 'ch-30157', 'ch-30158', 'ch-30232', 'ch-30221', 'ch-30222', 'ch-30223', 'ch-30234', 'ch-91', 'ch-100', 'ch-30235', 'ch-30236', 'ch-30237', 'ch-30239', 'ch-30240', 'ch-30241', 'ch-30242', 'ch-30249', 'ch-30256', 'ch-30253', 'ch-30250', 'ch-30257', 'ch-30255', 'ch-30251', 'ch-30252', 'ch-30254', 'ch-30258', 'ch-30259', 'ch-30260', 'ch-30261', 'ch-30262', 'ch-30263', 'ch-30264', 'ch-30265', 'ch-30372', 'ch-30373', 'ch-30374', 'ch-30375', 'ch-30376']

    let channels = []

    let offset = 0
    while (offset !== undefined) {
      const data = await axios
        .get(`https://web-api.tv.nu/tableauLinearChannels`, {
          params: {
            modules,
            date: dayjs().format('YYYY-MM-DD'),
            limit: 12,
            offset
          }
        })
        .then(r => r.data)
        .catch(console.error)

      console.log(data.data.nextOffset)

      data.data.modules.forEach(item => {
        channels.push({
          lang: 'sv',
          name: item.content.name,
          site_id: item.content.slug
        })
      })

      offset = data.data.nextOffset
    }

    return channels
  }
}

function parseStart(item) {
  if (!item.broadcast || !item.broadcast.startTime) return null

  return dayjs(item.broadcast.startTime)
}

function parseStop(item) {
  if (!item.broadcast || !item.broadcast.endTime) return null

  return dayjs(item.broadcast.endTime)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !data.data || !Array.isArray(data.data.broadcasts)) return []

  return data.data.broadcasts
}
