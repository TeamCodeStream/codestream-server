'use strict';

var API_Server_Module = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
var CodeStream_Emails = require('./codestream_emails');

class Email extends API_Server_Module {

	services () {
		return (callback) => {
			if (!this.api.config.email) {
				this.api.warn('Will not send emails, no email configuration supplied');
				return process.nextTick(callback);
			}

			this.api.log('Initiating email...');
			this.codestream_emails = new CodeStream_Emails(this.api.config.email);
			return callback(null, [{ email: this.codestream_emails }]);
		};
	}
}

module.exports = Email;
