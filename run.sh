#!/bin/bash

#/**
# * @file run.sh
# * @brief just start WebGrab+Plus
# * @author Francis De Paemeleere
# * @date 31/07/2016
# */

#backup the current working dir
WG_BCKP_DIR="$(pwd)"

function quit {
    #restore previous working dir
    cd "$WG_BCKP_DIR"
    exit $1;
}

# check if mono can be found
which mono >/dev/null 2>&1 || { echo >&2 "Mono required, but it's not installed."; quit 1; }

# get the absolute path of the link (or relative path)
if [ -L $0 ] ; then
    DIR=$(dirname $(readlink -f $0)) ;
else
    DUTDIR=$(dirname $0) ;
    if [ "${DUTDIR:0:1}" = "/" ]; then
        DIR="$DUTDIR";
    else
        DIR=$PWD/$(dirname $0) ;
    fi
fi ;

mono "$DIR/bin/WebGrab+Plus.exe" "$DIR"

quit 0;

