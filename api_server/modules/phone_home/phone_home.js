// provides a service to the API server which performs a phone-home stats update for on-prem users

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const PhoneHomeService = require('./phone_home_service');

class PhoneHome extends APIServerModule {

	services () {
		// return a function that, when invoked, will return a service structure with 
		// phone home as a service to the API server app ... the phone home service itself
		// runs on an interval timer
		return async () => {
			// only applies to on-prem installations
			if (this.api.config.runTimeEnvironment !== 'onprem') {
				this.api.log('Not doing phone home because this is not an on-prem installation');
				return;
			}
			this.api.log('Initiating phone home for on-prem installation...');
			this.phoneHome = new PhoneHomeService({ api: this.api });
			this.phoneHome.initiate();
			return { phoneHome: this.phoneHome };
		};
	}
}

module.exports = PhoneHome;
