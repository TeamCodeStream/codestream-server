#!/usr/bin/env node

// Main executable for running the CodeStream Inbound Email Server

'use strict';

// load configurations
const ConfigDirectory = process.env.CS_MAILIN_TOP + '/config';
const InboundEmailConfig = require(ConfigDirectory + '/inbound_email');
const LoggerConfig = require(ConfigDirectory + '/logger');
const SecretsConfig = require(ConfigDirectory + '/secrets');
const ApiConfig = require(ConfigDirectory + '/api');
const SimpleFileLogger = require(process.env.CS_MAILIN_TOP + '/server_utils/simple_file_logger');
const ClusterWrapper = require(process.env.CS_MAILIN_TOP + '/server_utils/cluster_wrapper');

// establish our logger
var Logger = new SimpleFileLogger(LoggerConfig);

// invoke a node cluster master with our configurations provided
var ServerClass = require(process.env.CS_MAILIN_TOP + '/lib/inbound_email_server');
var MyClusterWrapper = new ClusterWrapper(
	ServerClass,
	{
		inboundEmail: InboundEmailConfig,
		api: ApiConfig,
		secrets: SecretsConfig,
		logger: Logger
	},
	Logger,
	{
		oneWorker: true
	}
);

// start up the master, this will launch workers to really get down to work
(async function() {
	try {
		await MyClusterWrapper.start();
	}
	catch (error) {
		console.error('Failed to start: ' + error); // eslint-disable-line no-console
		process.exit(1);
	}
})();
