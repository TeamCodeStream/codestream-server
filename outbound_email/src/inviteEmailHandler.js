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
		const isRegistered = await this.userIsRegistered();
		if (isRegistered) {
			return await this.renderForRegisteredUser();
		}
		else {
			return await this.renderForUnregisteredUser();
		}
	}

	async renderForRegisteredUser () {
		this.content = `
<html>
You can accept this invitation by going to the <b>username menu > Switch Organization</b> in CodeStream, and selecting the <b>${this.company.name}</b> organization.
<br/>
<br/>
<img style="display:inline-block" src="https://images.codestream.com/misc/Invitations.png" />
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
CodeStream’s IDE extension brings together the tools you use every day… GitHub, Jira, Slack and more than a dozen other services… right in your IDE, simplifying your daily workflow.<br/>
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

	async userIsRegistered () {
		const numRegisteredUsers = await this.data.users.countByQuery(
			{
				searchableEmail: this.user.email.toLowerCase(),
				isRegistered: true
			}
		);
		return numRegisteredUsers > 0;
	}
}

module.exports = InviteEmailHandler;

