// provides a service to the API server which performs a phone-home stats update for on-prem users

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const PhoneHomeService = require('./phone_home_service');

const ROUTES = [
	{
		method: 'get',
		path: 'no-auth/phone-home',
		func: 'handlePhoneHome' 
	}
];

class PhoneHome extends APIServerModule {

	services () {
		// return a function that, when invoked, will return a service structure with 
		// phone home as a service to the API server app ... the phone home service itself
		// runs on an interval timer
		return async () => {
			// only applies to on-prem installations
			if (this.api.config.sharedGeneral.runTimeEnvironment !== 'onprem' && !process.env.CS_API_TEST_PHONE_HOME) {
				this.api.log('Not doing phone home because this is not an on-prem installation');
				return;
			}
			this.api.log('Initiating phone home for on-prem installation...');
			this.phoneHome = new PhoneHomeService({ api: this.api });
			this.phoneHome.initiate();
			return { phoneHome: this.phoneHome };
		};
	}

	getRoutes () {
		return ROUTES;
	}

	handlePhoneHome (request, response) {
		(async () => {
			try {
				if (!this.phoneHome || this.api.config.apiServer.disablePhoneHome) {
					return response.status(401).send('Not Authorized');
				}
				await this.phoneHome.run();
				return response.status(200).send('OK');
			}
			catch (error) {
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				return response.status(403).send(message);
			}
		})();
	}
}

module.exports = PhoneHome;
