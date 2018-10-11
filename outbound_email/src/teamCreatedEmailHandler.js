'use strict';

const EmailHandler = require('./emailHandler');
const Config = require('./config');

class TeamCreatedEmailHandler extends EmailHandler {

	async getSendOptions () {
		const options = await super.getSendOptions();
		options.to = { email: 'team@codestream.com', name: 'CodeStream' };
		options.from = { email: Config.senderEmail, name: 'CodeStream' };
		return options;
	}
	
	async renderEmail () {
		const userName = this.sender.getUserDisplayName(this.user);
		this.content = `Created by ${userName}`;
		this.subject = `Team ${this.message.teamName} is now on CodeStream!`
	}
}

module.exports = TeamCreatedEmailHandler;
