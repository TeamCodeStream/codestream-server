'use strict';

const SlackUserHelper = require('./slack_user_helper');

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');

class GetSlackPostsRequest extends RestfulRequest {
	
	constructor (options) {
		super(options);
	}

	async authorize () {
		this.teamId = this.request.query.teamId;
		if (!this.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.teamId = this.teamId.toLowerCase();
		if (!this.user.hasTeam(this.teamId)) {
			throw this.errorHandler.error('readAuth', { reason: 'user must be a member of the team' });
		}
	}

	async process () {
		await this.requireAndAllow();
		await this.prepareBotToken();
		await this.fetchMessages();
		await this.fetchUsers();
	}

	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['teamId', 'providerTeamId', 'providerChannelId', 'ts']
				}
			}
		);
	}

	async prepareBotToken () {
		this.providerTeamId = this.request.query.providerTeamId;
		this.providerChannelId = this.request.query.providerChannelId;
		const team = await this.data.teams.getById(this.teamId);
		if (!team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		const providerInfo = team.get('serverProviderToken');
		this.botToken = (
			providerInfo &&
			providerInfo.slack &&
			providerInfo.slack.multiple &&
			providerInfo.slack.multiple[this.providerTeamId]
		);
		if (!this.botToken) {
			throw this.errorHandler.error('notFound', { reason: 'Slack bot must be configured for team' });
		}
		this.slackUserHelper = new SlackUserHelper({
			request: this,
			accessToken: this.botToken
		});
	}

	async fetchMessages () {
		this.ts = this.request.query.ts;
		let ok, error, messages;
		({ ok, messages } = await this.slackUserHelper.fetchReplies({
			channel: this.providerChannelId,
			ts: this.ts,
			oldest: this.ts,
			limit: 3,
			inclusive: true
		}));
		if (ok && messages && messages.length > 1) {
			this.responseData = {
				messages: messages.sort((a, b) => a.ts - b.ts)
			};
			return;
		} else if (ok && messages && messages.length === 1 && messages[0].thread_ts) {
			({ ok, messages } = await this.slackUserHelper.fetchReplies({
				channel: this.providerChannelId,
				ts: messages[0].thread_ts,
				oldest: this.ts,
				limit: 3,
				inclusive: true
			}));
			if (ok && messages && messages.length > 1) {
				this.responseData = {
					messages: messages.sort((a, b) => a.ts - b.ts)
				};
				return;
			}
		}
		({ ok, error, messages } = await this.slackUserHelper.fetchMessages({
			channel: this.providerChannelId,
			oldest: this.ts,
			limit: 3,
			inclusive: true
		}));
		if (!ok) {
			this.warn(`Error fetching messages from slack: ${JSON.stringify(error)}`);
			throw this.errorHandler.error('readAuth', { reason: 'Error fetching messages from Slack' });
		}
		this.responseData = {
			messages: messages.sort((a, b) => a.ts - b.ts)
		};
	}

	async fetchUsers () {
		if (!this.responseData || !this.responseData.messages || this.responseData.messages.length === 0) {
			return;
		}

		const userIds = this.responseData.messages.map(msg => msg.user);
		const users = {};
		for (const userId of userIds) {
			users[userId] = await this.slackUserHelper.getUserFromSlack(userId) || {};
			const csUser = await this.slackUserHelper.getUser(userId, this.teamId);
			if (csUser) {
				users[userId].csUser = {
					id: csUser.id,
					email: csUser.get('email'),
					fullName: csUser.get('fullName'),
					username: csUser.get('username')
				}
			}
		}
		this.responseData.users = users;
	}
}

module.exports = GetSlackPostsRequest;
