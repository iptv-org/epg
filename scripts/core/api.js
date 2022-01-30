class API {
  constructor(filepath) {
    this.collection = require(filepath)
  }

  get(id) {
    return this.collection.find(c => c.id === id)
  }
}

const api = {}

api.channels = new API('../data/channels.json')

module.exports = api
