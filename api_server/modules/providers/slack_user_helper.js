'use strict';

const Fetch = require('node-fetch');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

class SlackUserHelper {

	/**
	 * @param {{ request: APIRequest, accessToken: string }} options 
	 */
	constructor (options) {
		Object.assign(this, options);
	}

	async get (method, args) {
		const argString = Object.keys(args).map(key => `${key}=${args[key]}`).join('&');
		const request = await Fetch(`https://slack.com/api/${method}?${argString}`,
			{
				method: 'get',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.accessToken}`
				}
			}
		);
		const response = await request.json();
		if (!response.ok) {
			this.request.log(`SlackUserHelper get error=${response.error}`);
			return undefined;
		}
		return response;
	}

	async post (method, body) {
		const request = await Fetch(`https://slack.com/api/${method}`,
			{
				method: 'post',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.accessToken}`
				},
				body: JSON.stringify(body)
			}
		);
		return await request.json();
	}

	async createFauxUser (teamId, slackWorkspaceId, slackUserId) {
		const team = await this.request.data.teams.getById(teamId);
		if (!team) {
			return undefined;
		}
		let response;
		try {
			try {
				response = await this.getUserFromSlack(slackUserId);
			}
			catch (ex) {
				this.request.log(ex);
			}
			if (!response) {
				return undefined;
			}
			const userData = {
				email: response.user.profile.email,
				username: response.user.name,
				fullName: response.user.profile.real_name,
				timeZone: response.user.tz
			};

			if (response && response.ok) {
				userData.email = response.user.profile.email;
				userData.username = response.user.name;
				userData.fullName = response.user.profile.real_name;
				userData.timeZone = response.user.tz;
			}

			this.userCreator = new UserCreator({
				request: this.request,
				teamIds: [teamId],
				companyIds: [team.get('companyId')],
				userBeingAddedToTeamId: teamId,
				externalUserId: `slack::${teamId}::${slackWorkspaceId}::${slackUserId}`,
				dontSetInviteCode: true,
				ignoreUsernameOnConflict: true
			});
			let user = await this.userCreator.createUser(userData);
			await new AddTeamMembers({
				request: this.request,
				addUsers: [user],
				team: team
			}).addTeamMembers();

			user = await this.request.data.users.getById(user.id);
			return user;
		}
		catch (ex) {
			this.request.log(ex);
		}
		return undefined;
	}

	async isSlackUserConnected (slackUserId) {
		if (!slackUserId) return false;

		const users = await this.request.data.users.getByQuery(
			{
				providerIdentities: `slack::${slackUserId}`,
				deactivated: false
			},
			{ hint: UserIndexes.byProviderIdentities }
		);

		return users && users.length > 0;
	}

	async getUser (slackUserId, codestreamTeamId) {
		if (!slackUserId || !codestreamTeamId) return undefined;

		const users = await this.request.data.users.getByQuery(
			{
				providerIdentities: `slack::${slackUserId}`,
				deactivated: false
			},
			{ hint: UserIndexes.byProviderIdentities }
		);

		return users.find(user => {
			return (
				!user.get('deactivated') && 
				user.hasTeam(codestreamTeamId)
			);
		});
	}

	async getFauxUser (codestreamTeamId, slackWorkspaceId, slackUserId) {
		if (!codestreamTeamId || !slackWorkspaceId || !slackUserId) return undefined;

		const query = { externalUserId: `slack::${codestreamTeamId}::${slackWorkspaceId}::${slackUserId}` };
		const users = await this.request.data.users.getByQuery(query,
			{ hint: UserIndexes.byExternalUserId }
		);

		return users.find(user => {
			return (
				!user.get('deactivated') && 
				user.hasTeam(codestreamTeamId)
			);
		});
	}

	async getUserFromSlack (userId) {
		return this.get('users.info', {
			user: userId
		});
	}

	async getSlackUserByEmail (email) {
		return this.get('users.lookupByEmail', {
			email
		});
	}

	async getUserByEmail (emailAddress, codestreamTeamId) {
		if (!emailAddress) return undefined;

		const users = await this.request.data.users.getByQuery(
			{ searchableEmail: emailAddress.toLowerCase() },
			{ hint: UserIndexes.bySearchableEmail }
		);
		// faux users and real users might match on email address -- only return real users
		// that are on the team.
		for (const user of users) {
			if (!user.get('externalUserId') && user.hasTeam(codestreamTeamId)) return user;
		}

		return undefined;
	}

	async getPermalink (channel, message_ts) {
		return this.get('chat.getPermalink', {
			channel,
			message_ts
		});
	}

	async getCodeStreamUser (codeStreamUserId) {
		return this.request.data.users.getById(codeStreamUserId);
	}

	async processText (text, codestreamTeamId) {
		const mentionedUserIds = new Set();
		const replacements = {};
		const re = new RegExp('<@([^>]+)>', 'g');

		const matches = text.matchAll(re);
		for (const match of matches) {
			const userId = match[1];
			const user = await this.getUser(userId, codestreamTeamId);
			if (user) {
				mentionedUserIds.add(user.id);
				// TODO: use the correct value here
				replacements[userId] = `@${user.get('username')}`;
			} else {
				const slackUser = await this.getUserFromSlack(userId);
				if (slackUser && slackUser.user && slackUser.user.name) {
					replacements[userId] = `@${slackUser.user.name}`;
				}
			}
		}
		const newText = text.replace(re, (match, userId) => replacements[userId] || match);
		return {
			mentionedUserIds: [...mentionedUserIds],
			text: newText
		};
	}

	async postMessage (body) {
		return this.post('chat.postMessage', body);
	}

	async updateMessage (body) {
		return this.post('chat.update', body);
	}

	async deleteMessage (body) {
		return this.post('chat.delete', body);
	}

	async meMessage (body) {
		return this.post('chat.meMessage', body);
	}
}

module.exports = SlackUserHelper;
