const convert = require('xml-js')

const parser = {}

parser.parseChannels = function (xml) {
  const result = convert.xml2js(xml)
  const siteTag = result.elements.find(el => el.name === 'site')
  const channelsTags = siteTag.elements.filter(el => el.name === 'channels')

  const output = {
    site: siteTag.attributes.site,
    groups: []
  }

  channelsTags.forEach(channelsTag => {
    const channels = channelsTag.elements
      .filter(el => el.name === 'channel')
      .map(el => {
        const channel = el.attributes
        if (!el.elements) throw new Error(`Channel '${channel.xmltv_id}' has no valid name`)
        channel.name = el.elements.find(el => el.type === 'text').text
        channel.country = channelsTag.attributes.country
        channel.site = siteTag.attributes.site

        return channel
      })

    output.groups.push({
      country: channelsTag.attributes.country,
      channels
    })
  })

  return output
}

module.exports = parser
