'use strict';

const EmailHandler = require('./emailHandler');

class ResetPasswordEmailHandler extends EmailHandler {

	async renderEmail () {
		this.subject = 'Password reset instructions';
		this.content = `
<html>
Click the link below to set a new CodeStream password.<br/><br/>
<a clicktracking="off" href="${this.message.url}">Set New Password</a><br/><br/>
Link not working? Try this:<br/>
${this.message.url}<br/><br/>
- Team CodeStream<br/>
</html>
`;
	}
}

module.exports = ResetPasswordEmailHandler;
