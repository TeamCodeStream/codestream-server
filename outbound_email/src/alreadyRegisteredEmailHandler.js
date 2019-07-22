'use strict';

const EmailHandler = require('./emailHandler');

class AlreadyRegisteredEmailHandler extends EmailHandler {

	async renderEmail () {
		this.subject = 'You\'re all set to sign into CodeStream';
		this.content = `

<html>
It looks like you already have an account on CodeStream. Just open CodeStream in your IDE and sign back in. If you don't remember your password look for the link to reset it on the sign-in form.<br/><br/>
Team CodeStream<br/>
</html>
`;
	}
}

module.exports = AlreadyRegisteredEmailHandler;
