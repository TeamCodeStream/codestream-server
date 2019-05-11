'use strict';

const EmailHandler = require('./emailHandler');

class ConfirmationEmailHandler extends EmailHandler {

	// render the email, with a confirmation code, or a link to the web app
	// (to be deprecated?)
	async renderEmail () {
		if (this.message.url) {
			await this.renderWithLink();
		}
		else {
			await this.renderWithCode();
		}
	}

	// render the email with a tokenized link to the web app
	async renderWithLink () {
		this.subject = 'Confirm your email address';
		this.content = `
<html>
Click the link below to confirm that this is the right email address.<br/><br/>
<a clicktracking="off" href="${this.message.url}">Confirm Email Address</a><br/><br/>
Link not working? Try this:<br/>
${this.message.url}<br/><br/>
- Team CodeStream<br/>
</html>
`;
	}

	// render the email with a confirmation code, to be deprecated
	async renderWithCode () {
		this.subject = 'Confirm your email address';
		const code = this.user.confirmationCode;
		this.content = `
<html>
Before you get started on CodeStream, please take a second to make sure we've got the right email address. Enter the following code in the CodeStream pane in your IDE.<br/><br/>
${code}<br/><br/>
Team CodeStream<br/><br/>
</html>
`;
	}
}

module.exports = ConfirmationEmailHandler;
