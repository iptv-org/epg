#!/bin/bash

#!/bin/bash

# Change to script directory
cd /epg

# serve location
SERVE="/epg/serve/"
INPUT_FILE="guide.xml"
## NOS
npm run grab --- --site=nostv.pt
FINAL_FILE="guide_nos.xml"

sed -E -i 's/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -E -i 's/(<channel id=")([^"]*)"/\1\L\2"/g; s/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -i 's/starchannel.pt/fox.pt/g' "$INPUT_FILE"
sed -i 's/starcomedy.pt/24kitchen.pt/g' "$INPUT_FILE"
sed -i 's/starcrime.pt/foxcrime.pt/g' "$INPUT_FILE"
sed -i 's/starlife.pt/foxlife.pt/g' "$INPUT_FILE"
sed -i 's/starmovies.pt/foxmovies.pt/g' "$INPUT_FILE"
sed -i 's/axnmovies.pt/axnblack.pt/g' "$INPUT_FILE"

mv "$INPUT_FILE" "$SERVE""$FINAL_FILE"

## RTP
npm run grab --- --site=rtp.pt
FINAL_FILE="guide_rtp.xml"

sed -E -i 's/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -E -i 's/(<channel id=")([^"]*)"/\1\L\2"/g; s/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
mv "$INPUT_FILE" "$SERVE""$FINAL_FILE"

## MEO
npm run grab --- --site=meo.pt
FINAL_FILE="guide_meo.xml"

sed -E -i 's/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -E -i 's/(<channel id=")([^"]*)"/\1\L\2"/g; s/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -i 's/starchannel.pt/fox.pt/g' "$INPUT_FILE"
sed -i 's/starcomedy.pt/24kitchen.pt/g' "$INPUT_FILE"
sed -i 's/starcrime.pt/foxcrime.pt/g' "$INPUT_FILE"
sed -i 's/starlife.pt/foxlife.pt/g' "$INPUT_FILE"
sed -i 's/starmovies.pt/foxmovies.pt/g' "$INPUT_FILE"
sed -i 's/axnmovies.pt/axnblack.pt/g' "$INPUT_FILE"
mv "$INPUT_FILE" "$SERVE""$FINAL_FILE"

# ## UK
npm run grab --- --site=mytelly.co.uk
FINAL_FILE="guide_uk1.xml"

sed -E -i 's/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -E -i 's/(<channel id=")([^"]*)"/\1\L\2"/g; s/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
mv "$INPUT_FILE" "$SERVE""$FINAL_FILE"