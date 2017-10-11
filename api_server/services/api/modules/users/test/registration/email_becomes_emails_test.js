'use strict';

var Registration_Test = require('./registration_test');

class Email_Becomes_Emails_Test extends Registration_Test {

	get description () {
		return `should return valid user data and get emails from email when registering`;
	}

	before (callback) {
		super.before(() => {
			this.data.email = this.data.emails[0];
			delete this.data.emails;
			callback();
		});
	}

	validate_response (data) {
		this.data.emails = [this.data.email];
		delete this.data.email;
		super.validate_response(data);
	}
}

module.exports = Email_Becomes_Emails_Test;
