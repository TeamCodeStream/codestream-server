'use strict';

import http from 'http';
import https from 'https';
import socketIO from 'socket.io';
import prepareAdminServer from '../lib/adminServer';
import startSocketIOServer from '../lib/socketIOServer';
import systemStatusFactory from '../lib/systemStatus';
import AdminConfig from '../config/config';
import StructuredConfigFactory from '../../shared/codestream_configs/lib/structured_config';
import getAssetData from '../../shared/server_utils/get_asset_data';
import OnPremSupportData from '../../shared/server_utils/get_onprem_support_data';
import SimpleFileLogger from '../../shared/server_utils/simple_file_logger';
import GlobalData from '../config/globalData';

(async function() {
	// I know, globals are bad. But in this case, really convenient.
	// There is only one global object (defined in config/globalData.js)
	// and we initialize all of its properties here.

	// Our operational structured config object (could be a file or mongo)
	GlobalData.AdminConfig = AdminConfig;
	const Config = await AdminConfig.loadPreferredConfig({ wait: true });
	if (!Config.adminServer || Config.adminServer.adminServerDisabled) {
		console.error('admin server disabled or no config data provided');
		process.exit(1);
	}

	// Logger object
	GlobalData.Logger = new SimpleFileLogger(Config.adminServer.logger);
	await GlobalData.Logger.initialize();
	AdminConfig.logger = GlobalData.Logger;

	if (Config.adminServer.adminServerDisabled) {
		GlobalData.Logger.error('The admin server is disabled in the config. Good bye.');
		process.exit(1);
	}

	// Initialize installation data - this is updated dynamically
	GlobalData.Installation = await OnPremSupportData(GlobalData.Logger);

	// assetInfo from other services will come from the system status service watchers
	const assetData = await getAssetData({ logger: GlobalData.Logger });
	if (!Object.keys(GlobalData.Installation.dockerInfo).length) {
		GlobalData.Installation.assetInfo['onprem-admin'] = assetData.assetInfo?.fullName
			? `${assetData.assetInfo.fullName} (${assetData.assetInfo.assetEnvironment})`
			: `development sandbox (${Config.sharedGeneral.runTimeEnvironment})`;
	}

	GlobalData.Logger.info('installaionData', null, GlobalData.Installation);

	// AdminConfig is the structured config object used by the admin server
	// MongoStructuredConfig is the structured config object used for editing configs
	if (AdminConfig.configIsMongo()) {
		// if we've loaded our config from mongo, use that object for config editing
		GlobalData.MongoStructuredConfig = AdminConfig;
	} else {
		// if we've loaded our config from a file, create a new config object for config
		// editing using the config file's storage.mongo.url connection string
		GlobalData.MongoStructuredConfig = StructuredConfigFactory.create({ mongoUrl: Config.storage.mongo.url });
		await GlobalData.MongoStructuredConfig.initialize();
	}

	// Use the mongo structured config object's mongo client for all things mongo
	GlobalData.MongoClient = GlobalData.MongoStructuredConfig.getMongoClient();

	const adminServer = await prepareAdminServer();
	// Secure?
	const tlsOptions = Config.adminServer.ignoreHttps
		? null
		: {
				key: Config.adminServer.sslCert.key,
				cert: Config.adminServer.sslCert.cert,
				ca: Config.adminServer.sslCert.caChain,
		  };
	const myServer = tlsOptions ? https.createServer(tlsOptions, adminServer) : http.createServer(adminServer);

	// Create a socket IO server
	const io = socketIO(myServer);

	// start accepting connections on the socket io server
	startSocketIOServer(io);

	// this creates and starts the status monitor service
	GlobalData.SystemStatusMonitor = systemStatusFactory(Config, GlobalData.Installation, { logger: GlobalData.Logger, io });
	// console.log('admin-server(GlobalData)', GlobalData);

	// Make the socketIO accessible inside express middleware and the AdminServer itself
	//   available to middleware as req.app.get('io')
	//   available elsewhere as require('./adminServer').get('io')
	adminServer.set('io', io);

	// and away we go!
	myServer.listen(Config.adminServer.port, () => {
		GlobalData.Logger.info(`express server ${tlsOptions ? 'using https ' : ''}listening on port ${Config.adminServer.port}`);
	});
})();
