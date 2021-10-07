# EPG

![auto-update](https://github.com/iptv-org/epg/actions/workflows/auto-update.yml/badge.svg)
![update-codes](https://github.com/iptv-org/epg/actions/workflows/update-codes.yml/badge.svg)

EPG (Electronic Program Guide) for thousands of TV channels collected from different sources.

## Usage

To load a program guide, all you need to do is copy the link to one or more of the guides from the list below and paste it into your favorite player.

<details>
<summary>Expand</summary>
<br>

<!-- prettier-ignore -->
#include "./.readme/_table.md"

</details>

## List of supported channels

https://iptv-org.github.io/epg/index.html

## For Developers

You can also get a list of all available channels and their codes in JSON format by sending a GET request to:

```
https://iptv-org.github.io/epg/codes.json
```

If successful, you should get the following response:

<details>
<summary>Expand</summary>
<br>

```
[
  ...
  {
    "tvg_id": "CNNUSA.us",
    "display_name": "CNN USA",
    "logo": "https://cdn.tvpassport.com/image/station/100x100/cnn.png",
    "country": "us",
    "guides": [
      "https://iptv-org.github.io/epg/guides/tvtv.us.guide.xml",
      ...
    ]
  },
  ...
]
```

</details>

## Contribution

If you find a bug or want to contribute to the code or documentation, you can help by submitting an [issue](https://github.com/iptv-org/epg/issues) or a [pull request](https://github.com/iptv-org/epg/pulls).
