#!/usr/bin/env node

// Main executable for running the CodeStream Inbound Email Server

'use strict';

const InboundEmailServerConfig = require(process.env.CS_MAILIN_TOP + '/config/config');
const SimpleFileLogger = require(process.env.CS_MAILIN_TOP + '/server_utils/simple_file_logger');
const ClusterWrapper = require(process.env.CS_MAILIN_TOP + '/server_utils/cluster_wrapper');
const ServerClass = require(process.env.CS_MAILIN_TOP + '/lib/inbound_email_server');

(async function() {
	const Config = await InboundEmailServerConfig.loadPreferredConfig();

	// establish our logger
	const Logger = new SimpleFileLogger(Config.logger);

	// invoke a node cluster master with our configurations provided
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

	// start up the master, this will launch workers to really get down to work
	try {
		await MyClusterWrapper.start();
	}
	catch (error) {
		console.error('Failed to start: ' + error); // eslint-disable-line no-console
		process.exit(1);
	}
})();
