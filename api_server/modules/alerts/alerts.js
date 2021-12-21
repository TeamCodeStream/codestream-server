// provides an alerts service to the API server, allowing for the registration
// of alerts to be sent as special notifications to the client

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');

const ROUTES = [
	{
		method: 'get',
		path: '/no-auth/alerts',
		func: 'handleAlerts',
		describe: 'describeAlerts'
	}
];

class Alerts extends APIServerModule {

	getRoutes () {
		return ROUTES;
	}

	services () {
		// return a function that, when invoked, returns a service structure that can be
		// used to set or clear alerts
		return async () => {
			this.api.log('Initiating alerts service...');
			return { alerts: this };
		};
	}

	middlewares () {
		// return any API alerts in response header
		return (request, response, next) => {
			/*
			// for now, this only applies to on-prem, because broadcaster server failures
			// are the only thing that trigger these alerts
			if (!this.api.config.sharedGeneral.isOnPrem) { 
				return next(); 
			}

			(async () => {
				const alerts = await this.api.data.activeServerAlerts.getOneByQuery({ _id: '0' }) || {};
				delete alerts._id;
				delete alerts.id;
				const codes = Object.keys(alerts);
				if (codes.length > 0) {
					response.set('X-CS-API-Alerts', codes.join(','));
				}
				next();
			})();
			*/

			// add "announce history fetch" to capabilities as set by global variable
			(async () => {
				const announceHistoryFetches = await this.api.data.globals.getOneByQuery(
					{ tag: 'announceHistoryFetches' }, 
					{ overrideHintRequired: true }
				);
				if (announceHistoryFetches && announceHistoryFetches.enabled) {
					response.set('X-CS-API-Alerts', 'announceHistoryFetches');
				}
				next();
			})();
		};
	}

	// handle request to fetch active alert codes
	async handleAlerts (request, response) {
		const alerts = {}; //await this.api.data.activeServerAlerts.getOneByQuery({ _id: '0' }) || {};
		response.send(alerts);
	}

	// set an active alert
	async setAlert (code, info) {
		/*
		// for now, this only applies to on-prem, because broadcaster server failures
		// are the only thing that trigger these alerts
		if (!this.api.config.sharedGeneral.isOnPrem) { 
			return; 
		}

		await this.api.data.activeServerAlerts.updateDirect(
			{ _id: '0' },
			{ $set: { [code]: info } },
			{ upsert: true }
		);
		*/
	}

	// clear an active alert
	async clearAlert (code) {
		/*
		// for now, this only applies to on-prem, because broadcaster server failures
		// are the only thing that trigger these alerts
		if (!this.api.config.sharedGeneral.isOnPrem) { 
			return; 
		}

		await this.api.data.activeServerAlerts.updateDirect(
			{ id: '0' },
			{ $unset: { [code]: true } }, 
			{ upsert: true }
		);
		*/
	}

	describeAlerts () {
		return {
			tag: 'alerts',
			summary: 'Get any active alerts',
			description: 'If there are active alerts the API server thinks the client should be aware of, this is one mechanism to retrieve them (they are also returned via response header to every request).',
			access: 'No access rules',
			returns: {
				summary: 'An object containing active alert codes as keys, and additional info as values',
				looksLike: {
					'<code>': '<Object containing alert info as needed>'
				}
			}
		};
	}
}

module.exports = Alerts;
