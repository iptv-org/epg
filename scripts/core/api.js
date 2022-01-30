const _ = require('lodash')

class API {
  constructor(filepath) {
    this.collection = require(filepath)
  }

  find(query) {
    return _.find(this.collection, query)
  }
}

const api = {}

api.channels = new API('../data/channels.json')
api.countries = new API('../data/countries.json')
api.subdivisions = new API('../data/subdivisions.json')

module.exports = api
