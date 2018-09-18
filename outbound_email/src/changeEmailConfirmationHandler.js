'use strict';

const EmailHandler = require('./emailHandler');

class ChangeEmailConfirmationHandler extends EmailHandler {

	async renderEmail () {
		this.subject = 'Confirm your new email address';
		this.content = `
<html>
You requested to change the email address you use to sign into CodeStream. Click the link below to confirm that this is the right email address.<br/><br/>
<a clicktracking="off" href="${this.message.url}">Confirm Email Address</a><br/><br/>
Link not working? Try this:<br/>
${this.message.url}<br/><br/>
- Team CodeStream<br/>
</html>
`;
	}
}

module.exports = ChangeEmailConfirmationHandler;
