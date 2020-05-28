#!/usr/bin/env node

// Main executable for running the CodeStream Broadcaster

'use strict';

// load configurations
const BroadcasterConfig = require(process.env.CS_BROADCASTER_TOP + '/config');
const SimpleFileLogger = require(process.env.CS_BROADCASTER_TOP + '/server_utils/simple_file_logger');
const ClusterWrapper = require(process.env.CS_BROADCASTER_TOP + '/server_utils/cluster_wrapper');

// start up the master, this will launch workers to really get down to work
(async function() {
	const Config = await BroadcasterConfig.loadPreferredConfig();

	// establish our logger
	const Logger = new SimpleFileLogger(Config.logger);

	// invoke a node cluster master with our configurations provided
	const ServerClass = require(process.env.CS_BROADCASTER_TOP + '/lib/broadcaster_server');
	const MyClusterWrapper = new ClusterWrapper(
		ServerClass,
		{
			config: Config,
			logger: Logger
		},
		{
			oneWorker: true
		}
	);

	try {
		await MyClusterWrapper.start();
	}
	catch (error) {
		console.error('Failed to start: ' + error); // eslint-disable-line no-console
		process.exit(1);
	}
})();
