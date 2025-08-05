import { Storage } from '@freearhey/core'

export interface DataLoaderProps {
  storage: Storage
}

export interface DataLoaderData {
  countries: object | object[]
  regions: object | object[]
  subdivisions: object | object[]
  languages: object | object[]
  categories: object | object[]
  blocklist: object | object[]
  channels: object | object[]
  feeds: object | object[]
  timezones: object | object[]
  guides: object | object[]
  streams: object | object[]
  logos: object | object[]
}
