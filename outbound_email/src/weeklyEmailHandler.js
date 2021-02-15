const EmailHandler = require('./emailHandler');

class WeeklyEmailHandler extends EmailHandler {

	async renderEmail () {
		throw 'not ready yet';
		this.subject = 'Your weekly email!';
		this.content = `
<html>
	THIS IS YOUR WEEKLY EMAIL!!!
</html>
`;
	}

	// analytics category for this email type
	getCategory () {
		return 'weekly';
	}
}

module.exports = WeeklyEmailHandler;