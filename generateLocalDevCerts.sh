#!/usr/bin/env bash

if ! type "certstrap" > /dev/null; then
  echo "certstrap is not installed.  Please install it via brew install certstrap"
  exit 1
fi

certstrap --depot-path certs init --common-name "codestream-dev" --passphrase ""
certstrap --depot-path certs request-cert \
  --common-name localhost.codestream.us \
  --domain '*.codestream.us','localhost','*.localhost' \
  --passphrase ""
certstrap --depot-path certs sign localhost.codestream.us --CA codestream-dev
