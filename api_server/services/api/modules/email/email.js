// the email module provides an email service to the api server

'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
var CodeStreamEmails = require('./codestream_emails');

class Email extends APIServerModule {

	services () {
		// this returns a factory function which will be called upon after all the modules
		// have been read in and initialized ... the factory function will then return
		// a service object that the app can use to send emails from wherever
		return (callback) => {
			if (!this.api.config.email) {
				this.api.warn('Will not send emails, no email configuration supplied');
				return process.nextTick(callback);
			}

			this.api.log('Initiating email...');
			this.codestreamEmails = new CodeStreamEmails(this.api.config.email);
			return callback(null, [{ email: this.codestreamEmails }]);
		};
	}
}

module.exports = Email;
