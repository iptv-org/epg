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
      this.items = await fetch('items.json')
        .then(response => response.json())
        .catch(console.log)

      this.isLoading = false
    }
  }))
})
