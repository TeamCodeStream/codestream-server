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
<br/>
In the CodeStream extension, select “Switch Teams” under the ellipses menu to check out discussions in the ${this.message.teamName} team.<br/>
</html>
`;
	}

	async renderForUnregisteredUser () {
		const ideLinks = {
			'VS Code': 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream',
			'Visual Studio': 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream-vs',
			'JetBrains': 'https://plugins.jetbrains.com/plugin/12206-codestream',
			'Atom': 'https://atom.io/packages/codestream'
		};
		const links = [];
		for (let ide in ideLinks) {
			const href = `<a clicktracking="off" href="${ideLinks[ide]}">${ide}</a>`;
			links.push(href);
		}
		const allLinks = links.slice(0, links.length - 1).join(', ') + ' or ' + links[links.length - 1];

		this.content = `
<html>
CodeStream's cloud-based service and IDE plugins help dev teams discuss, review, and understand code. Discussing code is now as simple as commenting on a Google Doc — select the code and type your question.<br/>
<br/>
1. Download CodeStream for ${allLinks}.<br/>
<br/>
2. Click “Find your team" and paste in your invitation code:<br/>
<b>${this.user.inviteCode}</b><br/>
<br/>
Team CodeStream<br/>
</html>
`;		
	}
}

module.exports = InviteEmailHandler;

