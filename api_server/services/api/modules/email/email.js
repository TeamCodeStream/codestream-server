'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
var CodeStreamEmails = require('./codestream_emails');

class Email extends APIServerModule {

	services () {
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
