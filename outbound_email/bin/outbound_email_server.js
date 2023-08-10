#!/usr/bin/env node

// Main executable for running the CodeStream Outbound Email Server
// (normally run on AWS Lambda, but can be run as a service for on-prem installations)

'use strict';


const OutboundEmailServerConfig = require(process.env.CSSVC_BACKEND_ROOT + '/outbound_email/src/config');
const NewRelicLogger = require('../../shared/server_utils/newrelic_logger');
const ClusterWrapper = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/cluster_wrapper');

// start up the master, this will launch workers to really get down to work
(async function() {
	const Config = await OutboundEmailServerConfig.loadPreferredConfig({ wait: true });

	// establish our logger
	const Logger = new NewRelicLogger();
	OutboundEmailServerConfig.logger = Logger;

	// invoke a node cluster master with our configurations provided
	const ServerClass = require(process.env.CSSVC_BACKEND_ROOT + '/outbound_email/src/outboundEmailServer');
	const MyClusterWrapper = new ClusterWrapper(
		ServerClass,
		{
			config: Config,
			logger: Logger // the logger passed to the constructed API Server
		},
		{
			logger: Logger // the logger passed to the constructed API Server
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
