'use strict';

import express from 'express';
// import bodyParser from 'body-parser';
import Api from '../api';
import ServerRenderApp from '../lib/serverRenderApp';
import AdminConfig from '../config/config';
import StructuredConfigFactory from '../../shared/codestream_configs/lib/structured_config';
import OnPremSupportData from '../../shared/server_utils/get_onprem_support_data';
import SimpleFileLogger from '../../shared/server_utils/simple_file_logger';
import GlobalData from '../config/globalData';

// serves the main page with a root element and initial data
// at which point the client fires up and loads the App component.
async function displayApp(req, res) {
	try {
		// FIXME: why doesn't this work - Logger is defined!!!??
		// console.log(Object.keys(GlobalData), GlobalData.Logger);
		// GlobalData.Logger.info('displayApp req url ', req.originalUrl);
		console.log('displayApp req url ', req.originalUrl);

		// give the client something to display while the app is starting up
		const { initialAppHtml, initialState } = await ServerRenderApp(req.originalUrl);
		res.render('index', {	// render with views/index.js
			content: initialAppHtml,
			initialState
		});
	}
	catch (error) {
		console.error(`Failed to render initial content: ${error}`);
	}
}

const ExpressServer = express();

// --- templating engine

// ejs defaults to 'views' directory for templates
ExpressServer.set('view engine', 'ejs');

// --- middleware

// we shall be uploading data in json form, so let's have it nicely parsed for us
ExpressServer.use(express.json());
ExpressServer.use(express.urlencoded({ extended: true }));

// --- server routing

// admin api
ExpressServer.use('/api', Api);

// static files - /s/* routes are read from directory public/
ExpressServer.use('/s', express.static('public'));
ExpressServer.use('/s/jquery', express.static('node_modules/jquery/dist'));
ExpressServer.use('/s/bootstrap', express.static('node_modules/bootstrap/dist'));

// All possible entry points into the app (bookmark-able) call the same function
const EntryRoutes = [
	'/status',
	'/configuration/topology',
	'/configuration/general',
	'/configuration/email',
	'/configuration/integrations',
	"/configuration/history",
	'/updates',
	'/support',
	'/license',
];
EntryRoutes.forEach(route => ExpressServer.get(route, (req, res) => displayApp(req, res)));

// --- Redirects

const RedirectRoutes = {
	'/': '/status',
	'/configuration': '/configuration/topology'
};
for (const [route, to] of Object.entries(RedirectRoutes)) {
	ExpressServer.get(route, (req, res) => res.redirect(to));
}

// --- Last resort

// uh oh!  Any other routes fail with 'bad url'
ExpressServer.get('*', (req, res) => res.send(`bad url: ${req.url}`));


// load the config data, setup a logger and fire up the server
(async function() {
	// I know, globals are bad. But in this case, really convenient.
	// There is only one global object (defined in config/globalData.js)
	// and we initialize all of its properties here.
	//
	// THIS IS THE OBLY PLACE WE WRITE TO THIS OBJECT. EVERYTHING ELSE
	// SHOULD BE READ-ONLY!!!!
	GlobalData.AdminConfig = AdminConfig;
	const Config = await AdminConfig.loadPreferredConfig();
	GlobalData.Logger = new SimpleFileLogger(Config.adminServer.logger);
	if (Config.adminServer.adminServerDisabled) {
		GlobalData.Logger.error('The admin server is disabled in the config. Good bye.');
		process.exit(1);
	}
	GlobalData.Installation = await OnPremSupportData();
	// this would not be needed if the admin config referred the mongo database where the config is stored
	const adminConfigIsMongo = false;
	if (adminConfigIsMongo) {
		GlobalData.MongoStructuredConfig = AdminConfig;
		GlobalData.MongoClient = AdminConfig.getMongoClient();
	}
	else {
		GlobalData.MongoStructuredConfig = StructuredConfigFactory.create({ mongoUrl: Config.storage.mongo.url });
		await GlobalData.MongoStructuredConfig.initialize();
		// await GlobalData.MongoStructuredConfig.loadConfig();
		GlobalData.MongoClient = GlobalData.MongoStructuredConfig.getMongoClient();
	}

	// console.log('admin-server(GlobalData)', GlobalData);
	// and away we go!
	ExpressServer.listen(Config.adminServer.port, () => {
		console.info(`express server listening on port ${Config.adminServer.port}`);
	});
})();
