# EPG

![auto-update](https://github.com/iptv-org/epg/actions/workflows/auto-update.yml/badge.svg)

EPG (Electronic Program Guide) for thousands of TV channels collected from different sources.

## Usage

To load a program guide, all you need to do is copy the link to one or more of the guides from the list below and paste it into your favorite player.

<!-- prettier-ignore -->
#include "./.readme/_countries.md"

### US States

<!-- prettier-ignore -->
#include "./.readme/_us-states.md"

### Provinces of Canada

<!-- prettier-ignore -->
#include "./.readme/_ca-provinces.md"

## List of supported channels

https://iptv-org.github.io/epg/index.html

## API

### List of channels

```
https://iptv-org.github.io/epg/api/channels.json
```

```
[
  ...
  {
    "id": "CNNUSA.us",
    "name": [
      "CNN USA"
    ],
    "logo": "https://cdn.tvpassport.com/image/station/100x100/cnn.png",
    "country": "US",
    "guides": [
      "https://iptv-org.github.io/epg/guides/tvtv.us.guide.xml",
      ...
    ]
  },
  ...
]
```

<!-- ### List of programs

```
https://iptv-org.github.io/epg/api/programs.json
```

```
[
  ...
  {
    "channel": "CNNUSA.us",
    "site": "example.com",
    "lang": "en",
    "title": "Erin Burnett OutFront",
    "desc": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    "categories": [
      "Series",
      "News"
    ],
    "image": "https://example.com/banner.jpg",
    "start": 1641772800,
    "stop": 1641776400
  },
  ...
]
``` -->

## Contribution

If you find a bug or want to contribute to the code or documentation, you can help by submitting an [issue](https://github.com/iptv-org/epg/issues) or a [pull request](https://github.com/iptv-org/epg/pulls).
