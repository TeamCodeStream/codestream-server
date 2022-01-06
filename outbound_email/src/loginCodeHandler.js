'use strict';

const EmailHandler = require('./emailHandler');

class LoginCodeHandler extends EmailHandler {

	// render the email with a login code
	async renderEmail () {
		this.subject = `Your sign-in code is ${code}`;
		const code = this.user.loginCode;
		this.content = `
<html>
Paste the following code in your IDE to sign into CodeStream.<br/><br/>
${code}<br/><br/>
Team CodeStream<br/><br/>
</html>
`;
	}

	// TODO: set category
	getCategory () {
		return '';
	}
}

module.exports = LoginCodeHandler;
