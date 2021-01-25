
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';

import StoreFactory from '../src/store';
import { SystemStatuses } from '../src/store/actions/status';
import { globalNavItems, configNavItems } from '../src/store/actions/presentation';
import { MongoClient, Logger, SystemStatusMonitor, AdminConfig, Installation, MongoStructuredConfig } from '../config/globalData';
import AdminAccess from './adminAccess';

import App from '../src/components/App';

async function serverRenderApp(req) {
	// Here we initialize our state (on the server). initialization should not
	// require any syncronous work to be done. Want to serve a page as fast as
	// possible.
	const requestedRoute = req.originalUrl || "";
	let globalNavItem = requestedRoute.match(/\/(status|configuration|updates|support|license)/i);
	globalNavItem = globalNavItem && globalNavItem[1] in globalNavItems ? globalNavItem[1] : 'status';
	const presentation = {
		nav: {
			paneSelected: requestedRoute.startsWith('/configuration') ? globalNavItems.configuration : globalNavItem,
		},
		configuration: {
			paneSelected: configNavItems.topology,
			integrations: {
				messaging: {},	// slack, msteams
				tracking: {},	// trello, jira, ...
			},
			history: {
				summary: [],
			},
			general: {},
			topology: {}
		},
		updates: {},
		support: {},
		license: {},
	};
	const configRoute = requestedRoute.match(/configuration\/(topology|general|email|integrations|history)/i);
	if (configRoute) {
		if (configRoute[1] in configNavItems) {
			presentation.configuration.paneSelected = configRoute[1];
		}
		else {
			Logger.error('unknown configuration component');
			presentation.configuration.paneSelected = configNavItems.topology;
		}
	}

	const rootUser = await new AdminAccess(MongoClient, { logger: Logger }).retrieve({ id: 'root' });

	// If the admin server was started using a configuration file, it is
	// possible for the working configuration to be different from the active
	// mongo configuration. This is an acceptible condition.
	await MongoStructuredConfig.loadConfig({ reload: true });
	const activeConfigSerialNumber = MongoStructuredConfig.getConfigMetaDocument().serialNumber;
	Logger.debug(`serverRenderApp(): active config serial is ${activeConfigSerialNumber}`);
	Logger.debug(`system status is ${SystemStatusMonitor.systemStatus}`);
	const status = req.isAuthenticated()
		? {
				loggedIn: true,
				adminAccountExists: true,
				systemStatus: {
					status: SystemStatusMonitor.systemStatus,
					message: SystemStatusMonitor.systemStatusMsg,
					alerts: SystemStatusMonitor.activeAlerts,
				},

				// SystemStatusMonitor history and other messages.
				// FIXME: we need a way to prune this list. We may also want to consider having these
				// persist in mongo
				statusMessages: [],

				// activeConfigInfo: MongoStructuredConfig.getConfigMetaDocument({ excludeConfigData: true }),
				activeConfigSerialNumber: activeConfigSerialNumber,
				codeSchemaVersion: AdminConfig.getSchemaVersion(), // schemaVersion of the code base
				runningRevision: AdminConfig.getConfigType() === 'mongo' ? AdminConfig.getConfigMetaDocument().revision : null, // config rev of running server (null for file)
				unsavedChanges: null, // true if unsaved changes were made, false if not
				serialLastLoaded: null, // serial number of config last loaded
		  }
		: {
				loggedIn: false,
				adminAccountExists: rootUser ? true : false,
				systemStatus: {
					status: SystemStatuses.pending,
					message: 'not logged in',
					alerts: [],
				},

				// SystemStatusMonitor history and other messages.
				// FIXME: we need a way to prune this list. We may also want to consider having these
				// persist in mongo
				statusMessages: [],

				unsavedChanges: null, // true if unsaved changes were made, false if not
				serialLastLoaded: null, // serial number of config last loaded
		  };

	// Make a store
	const Store = StoreFactory({
		config: req.isAuthenticated() ? AdminConfig.getNativeConfig() : {}, // active native configuration (this could be from a file)
		installation: Installation, // installation meta data
		presentation,
		status,
	});

	// Render the App (root element)
	const initialAppHtml = await ReactDOMServer.renderToString(
		<Provider store={Store}>
			<App />
		</Provider>
	);
	return {
		initialAppHtml,
		initialState: Store.getState()
	};
}

export default serverRenderApp;
