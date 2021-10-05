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
		if (!inviter || inviter.deactivated) {
			throw 'Inviter not found: ' + this.message.inviterId;
		}
		const inviterName = inviter.fullName || inviter.email;
		if (this.team && this.team.isEveryoneTeam) {
			this.subject = `${inviterName} invited you to collaborate`;
		} else {
			this.subject = `${inviterName} invited you to collaborate with ${this.message.teamName}`;
		}
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
In the CodeStream extension, select “Switch Teams” under the headshot menu to check out discussions in the ${this.message.teamName} team.<br/>
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

		const downloadOrInstall = this.team && this.team.isEveryoneTeam ? 'Install' : 'Download';
		const inviteCodeCopy =  this.team && this.team.isEveryoneTeam ? `
2. Sign up using <b>${this.user.email}</b>.<br/>
<br/>
` :
`
2. Paste your invitation code in the "Is your team already on CodeStream?" section:<br/>
<b>${this.user.inviteCode}</b><br/>
<br/>
`;
		this.content = `
<html>
CodeStream's cloud-based service and IDE plugins help dev teams discuss, review, and understand code. Discussing code is now as simple as commenting on a Google Doc — select the code and type your question.<br/>
<br/>
1. ${downloadOrInstall} CodeStream for ${allLinks}.<br/>
<br/>
${inviteCodeCopy}
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

