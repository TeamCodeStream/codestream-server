#!/bin/sh

# Master test script launcher

cd $CS_INBOUND_EMAIL_TOP
$CS_INBOUND_EMAIL_TOP/node_modules/mocha/bin/mocha
