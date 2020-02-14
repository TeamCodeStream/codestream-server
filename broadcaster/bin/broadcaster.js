#!/usr/bin/env node

// Main executable for running the CodeStream Broadcaster

'use strict';

// load configurations
const BroadcasterConfig = require(process.env.CS_BROADCASTER_TOP + '/config');
const SimpleFileLogger = require(process.env.CS_BROADCASTER_TOP + '/server_utils/simple_file_logger');
const ClusterWrapper = require(process.env.CS_BROADCASTER_TOP + '/server_utils/cluster_wrapper');

// establish our logger
const Logger = new SimpleFileLogger(BroadcasterConfig.logger);

// invoke a node cluster master with our configurations provided
const ServerClass = require(process.env.CS_BROADCASTER_TOP + '/lib/broadcaster_server');
var MyClusterWrapper = new ClusterWrapper(
	ServerClass,
	{
		...BroadcasterConfig,
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
