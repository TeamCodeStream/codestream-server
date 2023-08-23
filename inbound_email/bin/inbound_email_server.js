#!/usr/bin/env node

// Main executable for running the CodeStream Inbound Email Server

'use strict';

const InboundEmailServerConfig = require(process.env.CSSVC_BACKEND_ROOT + '/inbound_email/config/config');
const SimpleFileLogger = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/simple_file_logger');
const ClusterWrapper = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/cluster_wrapper');
const ServerClass = require(process.env.CSSVC_BACKEND_ROOT + '/inbound_email/lib/inbound_email_server');

(async function() {
	const Config = await InboundEmailServerConfig.loadPreferredConfig({ wait: true });

	// establish our logger
	const Logger = new SimpleFileLogger(Config.inboundEmailServer.logger);
	await Logger.initialize(); // so we can write to the log immediately
	InboundEmailServerConfig.logger = Logger;

	// invoke a node cluster master with our configurations provided
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

	// start up the master, this will launch workers to really get down to work
	try {
		await MyClusterWrapper.start();
	}
	catch (error) {
		console.error('Failed to start: ' + error); // eslint-disable-line no-console
		process.exit(1);
	}
})();
