#!/bin/bash

#/**
# * @file SiteIni.Pack.Update.sh
# * @brief will update the siteini.pack folder
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

which unzip >/dev/null 2>&1 || { echo >&2 "unzip required, but it's not installed."; quit 1; }
which wget >/dev/null 2>&1 || { echo >&2 "wget required, but it's not installed."; quit 1; }

# set wget progress option
wget --help | grep -q '\--show-progress' && \
  _PROGRESS_OPT="-q --show-progress" || _PROGRESS_OPT=""

function download {
    wget $_PROGRESS_OPT "$1"
    if [[ $? -ne 0 ]]
    then
        return 1
    fi
    return 0
}

# get the absolute path of the link (or relative path)
if [ -L $0 ] ; then
    DIR=$(dirname $(readlink -f $0)) ;
else
    DIR=$PWD/$(dirname $0) ;
fi ;

# move to the real folder
cd "$DIR/.."

#check if we can see the current siteini.pack
echo " ==> detecting siteini.pack"
if [ ! -d "siteini.pack" ]
then
    echo "$(pwd)"
    echo "[error] Can't find current siteini.pack folder"
    quit 1
fi

currentVersion="siteini.pack/*.txt"
files=( $currentVersion )

versionCurrent=${files[0]//[!0-9]/}
echo " ==> Current version: ($versionCurrent)"


content=$(wget http://www.webgrabplus.com/sites/default/files/download/ini/latest_version.txt -q -O -)
#echo "${content//[!0-9]/}"
versionOnline=${content//[!0-9]/}
echo " ==> Online  version: ($versionOnline)"

if (( "$versionCurrent" >= "$versionOnline" ))
then
	echo " ==> Already up-to-date"
	quit 0
fi

echo " ==> removing history file"
#remove older downloaded file (if it would exist)
rm -f SiteIniPack_current.zip

echo " ==> download new siteini.pack package"
#download new file
download "http://webgrabplus.com/sites/default/files/download/ini/SiteIniPack_current.zip"
if [[ $? -ne 0 ]]
then
    echo "[error] Download of the siteini.pack failed"
    quit 1
fi

echo " ==> remove old siteini.pack"
#remove old siteini.pack
rm -rf siteini.pack
#check if the siteini.pack was deleted correctly
if [ -d "siteini.pack" ]
then
    echo "[error] Can't delete old siteini.pack folder"
    rm -f SiteIniPack_current.zip
	quit 1
fi

echo " ==> extract new siteini.pack"
#extract new siteini.pack
unzip -q SiteIniPack_current.zip -d .

echo " ==> cleanup"
#remove older downloaded file
rm -f SiteIniPack_current.zip

quit 0
