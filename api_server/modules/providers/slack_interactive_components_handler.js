const { WebClient } = require('@slack/web-api');
const url = require('url');
const PostCreator = require(process.env.CS_API_TOP +
	'/modules/posts/post_creator');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const { post } = require(process.env.CS_API_TOP + '/server_utils/https_bot');
const SlackInteractiveComponentBlocks = require('./slack_interactive_component_blocks');
const { keyBy } = require('lodash');
const MomentTimezone = require('moment-timezone');

class SlackInteractiveComponentsHandler {
	constructor(request, payloadData) {
		Object.assign(this, request);

		this.log = request.api.log;
		this.logger = this.api.logger;

		this.payload = payloadData.payload;
		this.actionPayload = payloadData.actionPayload;
	}

	async process() {
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

	async handleBlockActionGeneric() {
		const payloadActionUser = await this.getUser(this.payload.user.id);
		if (payloadActionUser) {
			const team = await this.getTeam(
				payloadActionUser,
				this.actionPayload.teamId
			);
			return {
				actionUser: payloadActionUser,
				actionTeam: team,
				payloadUserId: this.payload.user.id
			};
		}
		return undefined;
	}

	async handleViewSubmission() {
		let privateMetadata;
		let user;
		let team;
		try {
			privateMetadata = JSON.parse(this.payload.view.private_metadata);
		} catch (ex) {
			return undefined;
		}
		try {
			if (!privateMetadata.codemarkId) {
				this.log('codemarkId is missing');
				return undefined;
			}
			// this userId is the person who clicked
			user = await this.getUser(privateMetadata.userId);
			team = await this.getTeam(user, privateMetadata.teamId);
			const text = SlackInteractiveComponentBlocks.getReplyText(
				this.payload.view.state
			);
			const postCreator = new PostCreator({
				request: { ...this, user: user, team: team }
			});

			await postCreator.createPost({
				streamId: privateMetadata.streamId,
				text: text,
				// TODO what goes here?
				origin: 'Slack',
				// TODO implement this
				parentCodemarkId: privateMetadata.codemarkId
			});
			this.request.responseData = this.request.responseData || {};
			this.request.responseData['post'] = postCreator.model.getSanitizedObject({
				request: this
			});
			await postCreator.postCreate();
		} catch (error) {
			this.log(error);
		}

		return {
			actionUser: user,
			payloadUserId: privateMetadata.userId,
			actionTeam: team,
			responseData: {
				response_action: 'update',
				view: SlackInteractiveComponentBlocks.createModalUpdatedView()
			}
		};
	}

	async handleBlockActionReply() {
		let user;
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

		// the user that clicked on the thing
		payloadActionUser = users.find(_ => {
			const providerIdentities = _.get('providerIdentities');
			if (providerIdentities &&
				providerIdentities.indexOf(`slack::${this.payload.user.id}`) > -1
			) {
				return _;
			}
			return undefined;
		});

		const codemarks = await this.data.codemarks.getByQuery(
			{ id: this.data.codemarks.objectIdSafe(this.actionPayload.codemarkId), deactivated: false },
			{ overrideHintRequired: true }
		);

		const team = await this.getTeam(user, this.actionPayload.teamId);
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

		const blocks = await this.createModalBlocks(user, codemark);
		let hasError = false;
		for (let i = 0; i < users.length; i++) {
			hasError = false;
			const user = users[0];
			if (user) {
				client = await this.tryCreateClient(user, this.payload.user);
				if (client) {
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
						hasError = true;
						if (ex.data) {
							try {
								this.log(JSON.stringify(ex.data));
							} catch (x) {
								// suffer
							}
						}
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
				if (hasError) {
					await this.postEphemeralMessage(
						this.payload.response_url,
						SlackInteractiveComponentBlocks.createMarkdownBlocks('Oops, something happened. ')
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
				payloadUserId: this.payload.user.id
			};
		}

		return {
			actionUser: payloadActionUser,
			actionTeam: team,
			payloadUserId: this.payload.user.id
		};
	}

	async getUser(userId) {
		if (!userId) return undefined;
		const users = await this.data.users.getByQuery(
			{
				providerIdentities: `slack::${userId}`,
				deactivated: false
			},
			{ hint: UserIndexes.byProviderIdentities }
		);

		if (users.length > 1) {
			// this shouldn't really happen
			this.log(`Multiple CodeStream users found matching identity ${userId}`);
			return undefined;
		}
		if (users.length === 1) {
			return users[0];
		}
		return undefined;
	}

	async getCodeStreamUser(codeStreamUserId) {
		return this.data.users.getById(codeStreamUserId);
	}

	// get the team the user is on, matching the identity
	async getTeam(user, teamId) {
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

	async tryCreateClient(user, slackUser) {
		if (!user || !slackUser.team_id) {
			this.log('Missing user or slack user');
			return undefined;
		}

		const providerInfo = user.get('providerInfo');
		if (!providerInfo) return undefined;

		const teamId = this.actionPayload.teamId;
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

	async createModalBlocks(user, codemark) {
		let replies;
		let postUsers;
		let userIds = [];
		if (this.actionPayload.codemarkId) {
			replies = await this.data.posts.getByQuery(
				{ codemarkId: this.actionPayload.codemarkId },
				{ overrideHintRequired: true, sort: { createdAt: -1 } }
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
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*${codemarkUser.get('fullName')}* ${this.formatTime(
						codemark.get('createdAt')
					)}\n${codemark.get('text')}${markerMarkdown}`
				}
			}
		];

		blocks.push(SlackInteractiveComponentBlocks.createModalReply());

		const replyBlocks = this.createReplyBlocks(replies, usersById);
		if (replyBlocks && replyBlocks.length) {
			blocks = blocks.concat(replyBlocks);
		}
		return blocks;
	}

	createReplyBlocks(replies, usersById) {
		if (replies && replies.length) {
			const blocks = [];
			for (let i = 0; i < replies.length; i++) {
				const reply = replies[i];
				const replyUser = usersById[reply.get('creatorId')];
				blocks.push({
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `*${replyUser.get('fullName')}* ${this.formatTime(
							reply.get('createdAt')
						)}\n${reply.get('text')}`
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

	async createMarkerMarkup(codemark) {
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

	async getUsers() {
		return Promise.all([
			// user that created the post (codestream userId)
			this.actionPayload.creatorId
				? new Promise(async resolve => {
					resolve(await this.getCodeStreamUser(this.actionPayload.creatorId));
				})
				: undefined,
			//user that clicked on the button
			this.payload.user.id
				? new Promise(async resolve => {
					resolve(await this.getUser(this.payload.user.id));
				})
				: undefined
		]);
	}

	async postEphemeralMessage(responseUrl, blocks, message) {
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

	formatTime(timeStamp) {
		const format = 'h:mm A MMM D';
		let timeZone = this.user && this.user.get('timeZone');
		if (!timeZone) {
			timeZone = this.creator && this.creator.get('timeZone');
			if (!timeZone) {
				timeZone = 'Etc/GMT';
			}
		}
		return MomentTimezone.tz(timeStamp, timeZone).format(format);
	}
}

module.exports = SlackInteractiveComponentsHandler;
