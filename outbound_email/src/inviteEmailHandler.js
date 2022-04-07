'use strict';

const EmailHandler = require('./emailHandler');

class InviteEmailHandler extends EmailHandler {

	async getSendOptions () {
		const options = await super.getSendOptions();
		/*
		options.sender = await this.data.users.getById(this.message.inviterId);
		if (!options.sender) {
			throw 'Inviter not found: ' + this.message.inviterId;
		}
		*/
		return options;
	}

	async renderEmail () {
		const inviter = await this.data.users.getById(this.message.inviterId);
		this.team = this.message.teamId ? await this.data.teams.getById(this.message.teamId) : null;
		this.company = this.team ? await this.data.companies.getById(this.team.companyId) : null;
		if (!this.company) {
			throw `Company not found: teamId=${this.message.teamId} companyId=${this.team ? this.team.companyId : 'NO TEAM'}`;
		}
		if (!inviter || inviter.deactivated) {
			throw 'Inviter not found: ' + this.message.inviterId;
		}
		const inviterName = inviter.fullName || inviter.email;
		this.subject = `${inviterName} invited you to collaborate`;
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
I've added you to the ${this.company.name} organization on CodeStream so that we can discuss code.<br/>
<br/>
In the CodeStream extension, select “Switch Organizations" under the headshot menu to check out discussions in the ${this.company.name} organization.<br/>
</html>
`;
	}

	async renderForUnregisteredUser () {
		const ideLinks = {
			'VS Code': 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream',
			'Visual Studio': 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream-vs',
			'JetBrains': 'https://plugins.jetbrains.com/plugin/12206-codestream'
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
1. Install CodeStream for ${allLinks}.<br/>
<br/>
2. Sign up using <b>${this.user.email}</b>.<br/>
<br/>
Team CodeStream<br/>
</html>
`;		
	}

	// analytics category for this email type
	getCategory () {
		return this.message.isReinvite ? 'reinvitation' : 'invitation';
	}
}

module.exports = InviteEmailHandler;

