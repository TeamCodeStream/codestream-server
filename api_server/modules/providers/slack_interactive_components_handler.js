const { WebClient } = require('@slack/web-api');
const Fetch = require('node-fetch');
const url = require('url');
const PostCreator = require(process.env.CS_API_TOP +
	'/modules/posts/post_creator');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const PostIndexes = require(process.env.CS_API_TOP + '/modules/posts/indexes');
const { post } = require(process.env.CS_API_TOP + '/server_utils/https_bot');
const SlackInteractiveComponentBlocks = require('./slack_interactive_component_blocks');
const { keyBy } = require('lodash');
const MomentTimezone = require('moment-timezone');

class SlackInteractiveComponentsHandler {
	constructor (request, payloadData) {
		Object.assign(this, request);

		this.log = request.api.log;
		this.logger = this.api.logger;

		this.payload = payloadData.payload;
		this.actionPayload = payloadData.actionPayload;
	}

	async process () {
		// this.log(JSON.stringify(this.payload, null, 4));
		this.log(
			`Processing payload.type=${this.payload.type}, actionPayload.linkType=${this.actionPayload.linkType}`
		);

		if (this.payload.type === 'block_actions') {
			if (this.actionPayload.linkType === 'reply') {
				return this.handleBlockActionReply();
			} else {
				return this.handleBlockActionGeneric();
			}
		} else if (this.payload.type === 'view_submission') {
			return this.handleViewSubmission();
		} else {
			this.log(`payload.type=${this.payload.type} cannot be handled.`);
		}
		return undefined;
	}

	async handleBlockActionGeneric () {
		const payloadActionUser = await this.getUser(this.actionPayload.tId, this.payload.user.team_id, this.payload.user.id);
		const team = await this.getTeam(
			payloadActionUser,
			this.actionPayload.tId
		);
		return {
			actionUser: payloadActionUser,
			actionTeam: team,
			payloadUserId: this.payload.user.id
		};
	}

	async handleViewSubmission () {
		let privateMetadata;
		let userThatClicked;

		let team;
		let postProcessAwaitable;
		try {
			privateMetadata = JSON.parse(this.payload.view.private_metadata);
		} catch (ex) {
			this.log('could not parse private_metadata');
			return undefined;
		}
		try {
			const users = await this.getUsers();
			userThatClicked = users[1];

			team = await this.getTeam(userThatClicked, privateMetadata.tId);
			if (!privateMetadata.ppId) {
				this.log('parentPostId is missing');
				return {
					hasError: true,
					actionUser: userThatClicked,
					payloadUserId: this.payload.user.id,
					actionTeam: team
				};
			}
			if (!userThatClicked) {
				// note, once we have faux users, this shouldn't be possible
				this.log('user is missing');
				return {
					hasError: true,
					actionUser: userThatClicked,
					payloadUserId: this.payload.user.id,
					actionTeam: team
				};
			}

			const text = SlackInteractiveComponentBlocks.getReplyText(
				this.payload.view.state
			);
			if (!text) {
				this.log('text is missing');
				return {
					hasError: true,
					actionUser: userThatClicked,
					payloadUserId: this.payload.user.id,
					actionTeam: team
				};
			}

			this.user = userThatClicked;
			this.team = team;
			const postCreator = new PostCreator({
				request: this
			});

			await postCreator.createPost({
				streamId: privateMetadata.sId,
				text: text,
				// TODO what goes here?
				origin: 'Slack',
				parentPostId: privateMetadata.ppId
			});
			this.request.responseData = this.request.responseData || {};
			this.request.responseData['post'] = postCreator.model.getSanitizedObject({
				request: this
			});

			postProcessAwaitable = postCreator.postCreate.bind(postCreator);
		} catch (error) {
			this.log(error);
		}

		return {
			actionUser: userThatClicked,
			payloadUserId: this.payload.user.id,
			actionTeam: team,
			postProcessAwaitable: postProcessAwaitable,
			responseData: {
				response_action: 'update',
				view: SlackInteractiveComponentBlocks.createModalUpdatedView()
			}
		};
	}

	getSlackExtraData (user) {
		const providerInfo = user && user.get('providerInfo');
		const slackProviderInfo = providerInfo && providerInfo[`${this.actionPayload.tId}`].slack.multiple[this.payload.user.team_id];
		return slackProviderInfo && slackProviderInfo.extra;
	}

	async handleBlockActionReply () {
		let client;
		let payloadActionUser;
		let success = false;
		const timeStart = new Date();
		// we are getting two users, but only using one of their accessTokens.
		// this is to allow non Slack authed users to reply from slack wo/having CS
		const users = await this.getUsers();
		if (!users || !users.length) {
			return undefined;
		}
		const userThatCreated = users[0];
		const userThatClicked = users[1];

		payloadActionUser = userThatClicked;

		const codemarks = await this.data.codemarks.getByQuery(
			{ id: this.data.codemarks.objectIdSafe(this.actionPayload.cId), deactivated: false },
			{ overrideHintRequired: true }
		);

		const team = await this.getTeam(userThatClicked || userThatCreated, this.actionPayload.tId);
		if (!codemarks || !codemarks.length || !codemarks[0]) {
			await this.postEphemeralMessage(
				this.payload.response_url,
				SlackInteractiveComponentBlocks.createMarkdownBlocks('Sorry, we couldn\'t find that codemark')
			);
			return {
				actionUser: payloadActionUser,
				actionTeam: team,
				payloadUserId: this.payload.user.id
			};
		}
		const codemark = codemarks[0];

		if (!team) {
			await this.postEphemeralMessage(
				this.payload.response_url,
				SlackInteractiveComponentBlocks.createMarkdownBlocks('Sorry, we couldn\'t find your team')
			);
			return undefined;
		}

		const blocks = await this.createModalBlocks(codemark, this.getSlackExtraData(userThatClicked));
		let hasCaughtError = false;
		for (let i = 0; i < users.length; i++) {
			hasCaughtError = false;
			const user = users[0];
			if (!user) continue;

			client = await this.tryCreateClient(user, this.payload.user);
			if (!client) continue;

			let modalResponse;
			try {
				modalResponse = await client.views.open({
					trigger_id: this.payload.trigger_id,
					view: SlackInteractiveComponentBlocks.createModalView(
						this.payload,
						this.actionPayload,
						blocks
					)
				});
				if (modalResponse && modalResponse.ok) {
					success = true;
					// note, this message assumes that the first user is the creator
					this.log(
						`Using token from the user that ${i == 0 ? 'created' : 'clicked'} the button. userId=${user.get('_id')}`
					);

					break;
				}
			} catch (ex) {
				this.log(ex);
				hasCaughtError = true;
				if (ex.data) {
					try {
						this.log(JSON.stringify(ex.data));
					} catch (x) {
						// suffer
					}
				}
			}
		}

		if (!success) {
			const timeEnd = new Date();
			const timeDiff = timeStart.getTime() - timeEnd.getTime();
			const secondsBetween = Math.abs(timeDiff / 1000);
			if (secondsBetween >= 3) {
				await this.postEphemeralMessage(
					this.payload.response_url,
					SlackInteractiveComponentBlocks.createMarkdownBlocks('We took too long to respond, please try again. ')
				);
				this.log(`Took too long to respond (${secondsBetween} seconds)`);
			}
			else {
				if (hasCaughtError) {
					await this.postEphemeralMessage(
						this.payload.response_url,
						SlackInteractiveComponentBlocks.createMarkdownBlocks('Oops, something happened. Please try again. ')
					);
					this.log('Oops, something happened.');
				}
				else {
					await this.postEphemeralMessage(
						this.payload.response_url,
						SlackInteractiveComponentBlocks.createRequiresAccess()
					);
					this.log('Was not able to show a modal (generic)');
				}
			}

			return {
				actionUser: payloadActionUser,
				actionTeam: team,
				hasError: true,
				payloadUserId: this.payload.user.id
			};
		}

		return {
			actionUser: payloadActionUser,
			actionTeam: team,
			payloadUserId: this.payload.user.id
		};
	}

	async getUser (codestreamTeamId, slackWorkspaceId, slackUserId) {
		if (!codestreamTeamId || !slackWorkspaceId || !slackUserId) return undefined;

		const query = { deactivated: false };
		query[`providerInfo.${codestreamTeamId}.slack.multiple.${slackWorkspaceId}.data.user_id`] = slackUserId;

		const users = await this.data.users.getByQuery(query, { overrideHintRequired: true });

		if (users.length > 1) {
			// this shouldn't really happen
			this.log(`Multiple CodeStream users found matching identity slack workspaceId=${slackWorkspaceId} userId=${slackUserId} on codestream team=${codestreamTeamId}`);
			return undefined;
		}
		if (users.length === 1) {
			return users[0];
		}
		return undefined;
	}

	async getUserFromSlack (userId, accessToken) {
		const request = await Fetch(
			`https://slack.com/api/users.info?user=${userId}`,
			{
				method: 'get',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${accessToken}`
				}
			}
		);

		const response = await request.json();
		if (!response.ok) {
			return undefined;
		}
		return response;
	}

	async getUserByEmail (emailAddress) {
		if (!emailAddress) return undefined;

		const users = await this.data.users.getByQuery(
			{ searchableEmail: emailAddress.toLowerCase() },
			{ hint: UserIndexes.bySearchableEmail }
		);

		if (users.length > 1) {
			// this shouldn't really happen
			this.log(`Multiple CodeStream users found matching email ${emailAddress}`);
			return undefined;
		}
		if (users.length === 1) {
			return users[0];
		}
		return undefined;
	}


	async getCodeStreamUser (codeStreamUserId) {
		return this.data.users.getById(codeStreamUserId);
	}

	// get the team the user is on, matching the identity
	async getTeam (user, teamId) {
		if (!teamId) {
			this.log('Could not find teamId within the  action payload');
			return undefined;
		}
		if (user && !user.hasTeam(teamId)) {
			this.log(
				'User is not a member of the team provided in slack action payload'
			);
			return undefined;
		}
		return this.data.teams.getById(teamId);
	}

	async tryCreateClient (user, slackUser) {
		if (!user || !slackUser.team_id) {
			this.log('Missing user or slack user');
			return undefined;
		}

		const providerInfo = user.get('providerInfo');
		if (!providerInfo) return undefined;

		const teamId = this.actionPayload.tId;
		const teamProviderInfo = providerInfo[teamId];
		if (!teamProviderInfo) return undefined;

		if (!teamProviderInfo.slack || !teamProviderInfo.slack.multiple)
			return undefined;

		let authTestResponse;
		try {
			const slackProviderInfo = teamProviderInfo.slack.multiple[slackUser.team_id];
			if (!slackProviderInfo || !slackProviderInfo.accessToken) {
				this.log('Missing slack providerInfo');
				return undefined;
			}
			const client = new WebClient(slackProviderInfo.accessToken);
			authTestResponse = await client.auth.test();
			return authTestResponse && authTestResponse.ok ? client : undefined;
		} catch (x) {
			this.log(authTestResponse);
			this.log(x);
			return undefined;
		}
	}

	async createModalBlocks (codemark, slackUserExtra) {
		let replies;
		let postUsers;
		let userIds = [];
		if (this.actionPayload.ppId) {
			replies = await this.data.posts.getByQuery(
				{ parentPostId: this.actionPayload.ppId },
				{ hint: PostIndexes.byParentPostId, sort: { seqNum: -1 } }
			);
			// get uniques
			userIds = [
				...new Set([
					...replies.map(_ => _.get('creatorId')),
					codemark.get('creatorId')
				])
			];
		} else {
			userIds = [codemark.get('creatorId')];
		}

		postUsers = await this.data.users.getByIds(userIds);
		const usersById = keyBy(postUsers, function (u) {
			return u.get('_id');
		});
		const codemarkUser = usersById[codemark.get('creatorId')];
		const markerMarkdown = await this.createMarkerMarkup(codemark);
		let blocks = [
			{
				type: 'context',
				elements: [{
					type: 'mrkdwn',
					text: `*${codemarkUser.get('fullName')}* ${this.formatTime(
						codemark.get('createdAt'),
						slackUserExtra && slackUserExtra.tz
					)}`
				}]
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `${codemark.get('text')}${markerMarkdown}`
				}
			}
		];

		blocks.push(SlackInteractiveComponentBlocks.createModalReply());

		const replyBlocks = this.createReplyBlocks(replies, usersById, slackUserExtra);
		if (replyBlocks && replyBlocks.length) {
			blocks = blocks.concat(replyBlocks);
		}
		return blocks;
	}

	createReplyBlocks (replies, usersById, slackUserExtra) {
		if (replies && replies.length) {
			const blocks = [];
			for (let i = 0; i < replies.length; i++) {
				const reply = replies[i];
				const replyUser = usersById[reply.get('creatorId')];
				blocks.push(
					{
						type: 'context',
						elements: [{
							type: 'mrkdwn',
							text: `*${replyUser.get('fullName')}* ${this.formatTime(
								reply.get('createdAt'),
								slackUserExtra && slackUserExtra.tz
							)}`
						}]
					},
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `${reply.get('text')}`
						}
					});
				if (i < replies.length - 1) {
					blocks.push({
						type: 'divider'
					});
				}
			}
			return blocks;
		}
		return undefined;
	}

	async createMarkerMarkup (codemark) {
		let markers;
		let markerMarkdown = '';
		if (codemark.get('markerIds') && codemark.get('markerIds').length) {
			markers = await this.data.markers.getByIds(codemark.get('markerIds'));
			if (markers && markers.length) {
				markerMarkdown += '\n';
				for (const m of markers) {
					markerMarkdown += `\n${m.get('file')}\n\`\`\`${m.get('code')}}\`\`\``;
				}
			}
		}
		return markerMarkdown;
	}

	async getUsers () {
		// this assumes 2 possible users
		// 0: user that created the post
		// 1: user that clicked on the post
		// it's possible that they're the same

		let users = [];
		// if the user that created is the same as the user that clicked, we only need 1 lookup
		if (this.actionPayload.pcuId === this.payload.user.id) {
			let user = await this.getCodeStreamUser(this.actionPayload.crId);
			if (user) {
				users.push(user);
				users.push(user);
			}
			else {
				this.log(`could not find user crId=${this.actionPayload.crId}`);
			}
		}
		else {
			users = await Promise.all([
				// user that created the post (codestream userId)
				this.actionPayload.crId
					? new Promise(async resolve => {
						resolve(await this.getCodeStreamUser(this.actionPayload.crId));
					})
					: undefined,
				//user that clicked on the button
				this.payload.user.id
					? new Promise(async resolve => {
						resolve(await this.getUser(this.actionPayload.tId, this.payload.user.team_id, this.payload.user.id));
					})
					: undefined
			]);
			if (users[0] && !users[1]) {
				// see if we can map the user that clicked by email address
				try {
					const slackProviderInfo = users[0].get('providerInfo')[this.actionPayload.tId].slack.multiple[this.payload.user.team_id];
					if (slackProviderInfo) {
						const slackUser = await this.getUserFromSlack(this.payload.user.id, slackProviderInfo.accessToken);
						if (slackUser) {
							const userThatClicked = slackUser.user && slackUser.user.profile && await this.getUserByEmail(slackUser.user.profile.email);
							if (userThatClicked) {
								users[1] = userThatClicked;
							}
						}
					}
				}
				catch (ex) {
					this.log(ex.message);
				}
			}
		}

		return users;
	}

	async postEphemeralMessage (responseUrl, blocks, message) {
		const uri = url.parse(responseUrl);
		return new Promise(resolve => {
			post(
				uri.host,
				uri.port,
				uri.path,
				{
					text: message,
					response_type: 'ephemeral',
					replace_original: false,
					blocks: blocks
				},
				null,
				function (cb) {
					resolve(cb);
				}
			);
		});
	}

	formatTime (timeStamp, timeZone) {
		const format = 'h:mm A MMM D';
		if (!timeZone) {
			let timeZone = this.user && this.user.get('timeZone');
			if (!timeZone) {
				timeZone = this.creator && this.creator.get('timeZone');
			}
		}
		let value = MomentTimezone.tz(timeStamp, timeZone || 'Etc/GMT').format(format);
		if (!timeZone || timeZone === 'Etc/GMT') {
			return `${value} UTC`;
		}
		return value;
	}
}

module.exports = SlackInteractiveComponentsHandler;
