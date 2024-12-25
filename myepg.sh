#!/bin/bash

# serve location
SERVE="/epg/serve/"
## NOS
npm run grab --- --site=nostv.pt
INPUT_FILE="guide.xml"
FINAL_FILE="guide_nos.xml"

sed -E -i 's/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -E -i 's/(<channel id=")([^"]*)"/\1\L\2"/g; s/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -i 's/axnmovies.pt/axnblack.pt/g' "$INPUT_FILE"
mv "$INPUT_FILE" "$SERVE""$FINAL_FILE"

## RTP
npm run grab --- --site=rtp.pt
INPUT_FILE="guide.xml"
FINAL_FILE="guide_rtp.xml"

sed -E -i 's/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -E -i 's/(<channel id=")([^"]*)"/\1\L\2"/g; s/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
mv "$INPUT_FILE" "$SERVE""$FINAL_FILE"

## MEO
npm run grab --- --site=meo.pt
INPUT_FILE="guide.xml"
OUTPUT_FILE="guide_1.xml"
FINAL_FILE="guide_nos.xml"

sed -E -i 's/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
sed -E -i 's/(<channel id=")([^"]*)"/\1\L\2"/g; s/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE"
mv "$INPUT_FILE" "$SERVE""$FINAL_FILE"

# ## UK
# npm run grab --- --site=mytelly.co.uk
# INPUT_FILE="guide.xml"
# OUTPUT_FILE="guide_1.xml"
# FINAL_FILE="guide_uk1.xml"

# sed -E 's/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$INPUT_FILE" > "$OUTPUT_FILE"
# # Convert both <channel id> and <programme channel> to lowercase
# sed -E 's/(<channel id=")([^"]*)"/\1\L\2"/g; s/(<programme [^>]* channel=")([^"]*)"/\1\L\2"/g' "$OUTPUT_FILE" > "$FINAL_FILE"