document.addEventListener('alpine:init', () => {
  Alpine.data('list', () => ({
    isLoading: true,
    query: '',
    _query: '',
    items: [],

    search() {
      this._query = this.query.toLowerCase()
    },

    async init() {
      const countries = await fetch('api/countries.json')
        .then(response => response.json())
        .catch(console.log)

      const channels = await fetch('api/channels.json')
        .then(response => response.json())
        .catch(console.log)

      let items = {}
      for (let channel of channels) {
        if (!items[channel.country]) {
          if (!countries[channel.country]) {
            console.log('Warning: Wrong country code', channel)
            continue
          }

          const country = countries[channel.country]

          items[channel.country] = {
            flag: country.flag,
            name: country.name,
            expanded: false,
            channels: []
          }
        }

        channel.hash = `${channel.id}_${channel.name}`.toLowerCase()

        items[channel.country].channels.push(channel)
      }

      items = Object.values(items).sort((a, b) => {
        if (a.name > b.name) return 1
        if (a.name < b.name) return -1
        return 0
      })

      this.items = items
      this.isLoading = false
    }
  }))
})
