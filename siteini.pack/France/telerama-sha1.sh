#!/bin/bash

function hash_hmac {
  digest="$1"
  data="$2"
  key="$3"
  shift 3
  echo -n "$data" | openssl dgst "-$digest" -hmac "$key" "$@"
}

digest=$1
data=$2
key=$3

hash_hmac "$digest" "$data" "$key"
