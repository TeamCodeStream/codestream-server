'use strict';

const EmailHandler = require('./emailHandler');

class InviteEmailHandler extends EmailHandler {

	async getSendOptions () {
		const options = await super.getSendOptions();
		options.sender = await this.data.users.getById(this.message.inviterId);
		if (!options.sender) {
			throw 'Inviter not found: ' + this.message.inviterId;
		}
		return options;
	}

	async renderEmail () {
		this.subject = `Invitation to collaborate with ${this.message.teamName}`;
		if (this.user.isRegistered) {
			return await this.renderForRegisteredUser();
		}
		else {
			return await this.renderForUnregisteredUser();
		}
	}

	async renderForRegisteredUser () {
		this.content = `
<html>
I've added you to the ${this.message.teamName} team on CodeStream so that we can discuss code.<br/>
</html>
`;
	}

	async renderForUnregisteredUser () {
		this.content = `
<html>
CodeStream is a chat service made for developers which:<br/><br/>
&nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;Makes it easy to talk about code by putting team chat in your IDE<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;Anchors conversations to your codeblocks, so a knowledge base builds up over time<br/>
&nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;Connects to Slack and email, enabling easier team communication about code<br/><br/>
<a clicktracking="off" href="${this.message.checkOutLink}">Check out CodeStream</a><br/>
</html>
`;		
	}
}

module.exports = InviteEmailHandler;

