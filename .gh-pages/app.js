const ChannelItem = {
  props: ['channel'],
  template: `
    <tr>
      <td class="is-vcentered" style="min-width: 150px; text-align: center">
        <img
          loading="lazy"
          referrerpolicy="no-referrer"
          v-show="channel.logo"
          :src="channel.logo"
          style="max-width: 100px; max-height: 50px; vertical-align: middle"
        />
      </td>
      <td class="is-vcentered" nowrap>
        <p v-text="channel.name"></p>
      </td>
      <td class="is-vcentered" nowrap>
        <code v-text="channel.id"></code>
      </td>
      <td class="is-vcentered">
        <p v-for="guide in channel.guides"><code style="white-space: nowrap" v-text="guide"></code></p>
      </td>
    </tr>
  `
}

const CountryItem = {
  components: {
    ChannelItem
  },
  props: ['item', 'normQuery', 'regQuery'],
  data() {
    return {
      count: 0
    }
  },
  computed: {
    countryChannels() {
      if (!this.normQuery) return this.item.channels

      return (
        this.item.channels.filter(c => {
          const normResult = c.key.includes(this.normQuery)
          const regResult = this.regQuery
            ? this.regQuery.test(c.name) || this.regQuery.test(c.id)
            : false

          return normResult || regResult
        }) || []
      )
    }
  },
  watch: {
    countryChannels: function (value) {
      this.count = value.length
    }
  },
  template: `
    <div
      class="card mb-3 is-shadowless"
      style="border: 1px solid #dbdbdb"
      v-show="countryChannels && countryChannels.length > 0"
    >
      <div
        class="card-header is-shadowless is-clickable"
        @click="item.expanded = !item.expanded"
      >
        <span class="card-header-title">{{item.flag}}&nbsp;{{item.name}}</span>
        <button class="card-header-icon" aria-label="more options">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
              <path
                v-show="!item.expanded"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="48"
                d="M112 184l144 144 144-144"
              />
              <path
                v-show="item.expanded"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="48"
                d="M112 328l144-144 144 144"
              />
            </svg>
          </span>
        </button>
      </div>
      <div class="card-content" v-show="item.expanded || (count > 0 && normQuery.length)">
        <div class="table-container">
          <table class="table" style="min-width: 100%">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>TVG-ID</th>
                <th>EPG</th>
              </tr>
            </thead>
            <tbody>
              <channel-item v-for="channel in countryChannels" :channel="channel"></channel-item>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

const App = {
  components: {
    CountryItem
  },
  data() {
    return {
      isLoading: true,
      query: '',
      normQuery: '',
      regQuery: null,
      items: []
    }
  },
  methods: {
    search() {
      this.normQuery = this.query.replace(/\s/g, '').toLowerCase()
      this.regQuery = new RegExp(this.query)
    }
  },
  async mounted() {
    const guides = await fetch('https://iptv-org.github.io/epg/api/channels.json')
      .then(response => response.json())
      .catch(console.log)

    const channels = await fetch('https://iptv-org.github.io/api/channels.json')
      .then(response => response.json())
      .then(arr =>
        arr.map(c => {
          const found = guides.find(g => g.id === c.id)
          c.key = `${c.id}_${c.name}`.replace(/\s/g, '').toLowerCase()
          c.guides = found ? found.guides : []
          return c
        })
      )
      .then(arr => groupBy(arr, 'country'))
      .catch(console.log)

    const countries = await fetch('https://iptv-org.github.io/api/countries.json')
      .then(response => response.json())
      .catch(console.log)

    this.items = countries.map(i => {
      i.expanded = false
      i.channels = channels[i.code] || []
      return i
    })

    this.isLoading = false
  }
}

Vue.createApp(App).mount('#app')
