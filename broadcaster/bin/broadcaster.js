#!/usr/bin/env node

// Main executable for running the CodeStream Broadcaster

'use strict';

// load configurations
const BroadcasterConfig = require(process.env.CSSVC_BACKEND_ROOT + '/broadcaster/config');
const SimpleFileLogger = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/simple_file_logger');
const ClusterWrapper = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/cluster_wrapper');

// start up the master, this will launch workers to really get down to work
(async function() {
	const Config = await BroadcasterConfig.loadPreferredConfig({ wait: true });
	if (Config.broadcastEngine.selected !== 'codestreamBroadcaster') {
		console.error('this configuration does not support the codestream broadcaster');
		process.exit(1);
	}

	// establish our logger
	const Logger = new SimpleFileLogger(Config.broadcastEngine.codestreamBroadcaster.logger);
	await Logger.initialize(); // so we can write to the log immediately
	BroadcasterConfig.logger = Logger;

	// invoke a node cluster master with our configurations provided
	const ServerClass = require(process.env.CSSVC_BACKEND_ROOT + '/broadcaster/lib/broadcaster_server');
	const MyClusterWrapper = new ClusterWrapper(
		ServerClass,
		{
			config: Config,
			logger: Logger // the logger passed to the constructed server
		},
		{
			logger: Logger, // the logger used by ClusterWrapper itself
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
