const { WebClient } = require('@slack/web-api');
const Fetch = require('node-fetch');
const url = require('url');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const { post } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/https_bot');
const SlackInteractiveComponentBlocks = require('./slack_interactive_component_blocks');
const { keyBy } = require('lodash');
const MomentTimezone = require('moment-timezone');

// if we don't respond in this many seconds, Slack will treat the request
// as a failed request
const SLACK_TIMEOUT_SECONDS = 3;
const REPLY_SUBMISSION_TOO_SLOW = 'ReplySubmissionTooSlow';

const SAFE_VIEW_KEYS = ['type', 'callback_id', 'title', 'submit', 'close', 'block_id', 'label', 'url', 'action_id', 'multiline'];

const redactView = (key, value) => {
	if (SAFE_VIEW_KEYS.includes(key)) {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map(_ => JSON.stringify(_, redactView, 2));
	}
	if (typeof value === 'object') {
		return JSON.stringify(value, redactView, 2);
	}
	return 'REDACTED';
};

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
		const teamId = this.actionPayload.teamId || this.actionPayload.tId;
		const userId = this.payload && this.payload.user && this.payload.user.id;
		this.log(
			`Processing payload.type=${this.payload.type}, actionPayload.linkType=${this.actionPayload.linkType} userId=${userId} teamId=${teamId}`
		);
		try {
			if (this.payload.type === 'block_actions') {
				if (this.actionPayload.linkType === 'reply') {
					// codemark
					return await this.handleBlockActionReply();
				}
				else if (this.actionPayload.linkType === 'review-reply') {
					// review
					return await this.handleBlockActionReviewReply();
				}
				else {
					return await this.handleBlockActionGeneric();
				}
			} else if (this.payload.type === 'view_submission') {
				return await this.handleViewSubmission();
			} else {
				this.log(`payload.type=${this.payload.type} cannot be handled.`);
			}
		}
		catch (error) {
			this.log(`${error && error.message}. actionPayload=${JSON.stringify(this.actionPayload)} user=${JSON.stringify(this.payload.user)}`);
			throw error;
		}
		return undefined;
	}


	async handleBlockActionGeneric () {
		const teamId = this.actionPayload.teamId || this.actionPayload.tId;
		let payloadActionUser = await this.getUserWithoutTeam(this.payload.user.id);
		if (!payloadActionUser) {
			// if we can't find a user that has auth'd with slack, try to find a matching faux user
			payloadActionUser = await this.getFauxUser(teamId, this.payload.user.team_id, this.payload.user.id);
		}
		const team = await this.getTeam(
			payloadActionUser,
			teamId
		);
		return {
			actionUser: payloadActionUser,
			actionTeam: team,
			payloadUserId: this.payload.user.id
		};
	}

	async handleViewSubmission () {
		const timeStart = new Date();
		let privateMetadata;
		let userThatCreated;
		let userThatClicked;
		let userThatClickedIsFauxUser;
		let team;
		let error;
		let reason = 'ReplySubmissionGenericError';
		try {
			privateMetadata = JSON.parse(this.payload.view.private_metadata);
		} catch (ex) {
			this.log('could not parse private_metadata');
			return undefined;
		}
		try {
			const users = await this.getUsers();
			userThatClicked = users.userThatClicked;
			userThatCreated = users.userThatCreated;
			userThatClickedIsFauxUser = !!users.userThatClickedIsFauxUser;

			team = await this.getTeamById(privateMetadata.tId);
			if (!privateMetadata.ppId) {
				this.log('parentPostId is missing');
				return {
					actionUser: userThatClicked,
					actionTeam: team,
					error: {
						eventName: 'Provider Reply Denied',
						reason: 'ReplySubmissionParentPostIdMissing'
					},
					payloadUserId: this.payload.user.id
				};
			}

			if (!userThatClicked) {
				const user = await this.createFauxUser(team,
					this.getAccessToken(userThatCreated || userThatClicked, privateMetadata.tId, this.payload.user.team_id));
				if (user) {
					userThatClicked = user;
					userThatClickedIsFauxUser = true;
					this.createdUser = user;
				}
				else {
					this.log('User is missing / could not create faux user');
					return {
						error: {
							eventName: 'Provider Reply Denied',
							reason: 'ReplySubmissionUserMissing'
						},
						actionUser: userThatClicked,
						payloadUserId: this.payload.user.id,
						actionTeam: team
					};
				}
			}

			const text = SlackInteractiveComponentBlocks.getReplyText(
				this.payload.view.state
			);
			if (!text) {
				this.log('text is missing');
				return {
					error: {
						eventName: 'Provider Reply Denied',
						reason: 'ReplySubmissionTextMissing'
					},
					actionUser: userThatClicked,
					payloadUserId: this.payload.user.id,
					actionTeam: team
				};
			}

			this.user = userThatClicked;
			this.team = team;
			this.postCreator = new PostCreator({
				request: this
			});

			try {
				await this.postCreator.createPost({
					teamId: privateMetadata.tId,
					streamId: privateMetadata.sId,
					text: text,
					// TODO what goes here?
					origin: 'Slack',
					parentPostId: privateMetadata.ppId
				});
			} catch (postError) {
				this.log('Caught error creating post: ' + postError.message);
				this.log('Details: ' + JSON.stringify(postError));
				this.log('Stack: ' + postError.stack);
				throw postError;
			}
			const timeEnd = new Date();
			const timeDiff = timeStart.getTime() - timeEnd.getTime();
			const secondsBetween = Math.abs(timeDiff / 1000);
			if (secondsBetween >= SLACK_TIMEOUT_SECONDS) {
				throw new Error(REPLY_SUBMISSION_TOO_SLOW);
			}
		} catch (err) {
			this.log('Caught error creating slack reply: ' + err.message);
			this.log('Stack: ' + err.stack);
			error = {
				eventName: 'Provider Reply Denied',
				reason: err.message === REPLY_SUBMISSION_TOO_SLOW ?
					REPLY_SUBMISSION_TOO_SLOW : reason
			};
		}

		return {
			actionUser: userThatClicked,
			payloadUserId: this.payload.user.id,
			actionTeam: team,
			error: error,
			// this is the responseData that we'll send back to slack
			// NOTE it cannot contain any other extra properties, only what Slack expects
			responseData: {
				response_action: 'update',
				view: SlackInteractiveComponentBlocks.createModalUpdatedView(userThatCreated, userThatClickedIsFauxUser)
			}
		};
	}

	async createFauxUser (team, accessToken) {
		let response;
		try {
			try {
				response = await this.getUserFromSlack(this.payload.user.id, accessToken);
			}
			catch (ex) {
				this.log(ex);
			}
			const userData = {
				username: this.payload.user.name,
				fullName: this.payload.user.name
			};

			if (response && response.ok) {
				userData.email = response.user.profile.email;
				userData.username = response.user.name;
				userData.fullName = response.user.profile.real_name;
				userData.timeZone = response.user.tz;
			}

			this.userCreator = new UserCreator({
				request: this,
				teamIds: [team.get('id')],
				companyIds: [team.get('companyId')],
				userBeingAddedToTeamId: team.get('id'),
				externalUserId: `slack::${team.get('id')}::${this.payload.user.team_id}::${this.payload.user.id}`,
				dontSetInviteCode: true,
				ignoreUsernameOnConflict: true
			});
			let user = await this.userCreator.createUser(userData);
			await new AddTeamMembers({
				request: this,
				addUsers: [user],
				team: team
			}).addTeamMembers();

			user = await this.data.users.getById(user.id);
			return user;
		}
		catch (ex) {
			this.log(ex);
		}
		return undefined;
	}

	getSlackExtraData (user) {
		const providerInfo = user && user.get('providerInfo');
		if (!providerInfo) return undefined;

		const providerInfoByTeam = providerInfo[this.actionPayload.tId];
		if (!providerInfoByTeam) return undefined;

		const slackProviderInfo = providerInfoByTeam.slack &&
			providerInfoByTeam.slack.multiple &&
			providerInfoByTeam.slack.multiple[this.payload.user.team_id];
		return slackProviderInfo && slackProviderInfo.extra;
	}

	mergeActionPayloadData (codemark) {
		if (!codemark) return;

		// hydrate this object with some additional properties taken from the codemark
		this.actionPayload = {
			...this.actionPayload,
			sId: codemark.get('streamId'),
			tId: codemark.get('teamId'),
			crId: codemark.get('creatorId'),
			ppId: codemark.get('postId')
		};
	}

	mergeReviewActionPayloadData (review) {
		if (!review) return;

		// hydrate this object with some additional properties taken from the codemark
		this.actionPayload = {
			...this.actionPayload,
			sId: review.get('streamId'),
			tId: review.get('teamId'),
			crId: review.get('creatorId'),
			ppId: review.get('postId')
		};
	}

	async handleBlockActionReply () {
		let client;
		let payloadActionUser;
		let success = false;
		const timeStart = new Date();
		const codemark = await this.data.codemarks.getById(this.actionPayload.cId);
		this.mergeActionPayloadData(codemark);

		const team = await this.getTeamById(this.actionPayload.tId);
		if (!codemark || codemark.get('deactivated')) {
			await this.postEphemeralMessage(
				this.payload.response_url,
				SlackInteractiveComponentBlocks.createMarkdownBlocks('Sorry, we couldn\'t find that codemark')
			);
			return {
				error: {
					eventName: 'Provider Reply Denied',
					reason: 'OpenCodemarkCodemarkNotFound'
				}
			};
		}
		// we are getting two users, but only using one of their accessTokens.
		// this is to allow non Slack authed users to reply from slack wo/having CS
		const { userThatCreated, userThatClicked } = await this.getUsers();
		if (!userThatCreated && !userThatClicked) {
			return undefined;
		}

		payloadActionUser = userThatClicked;

		if (!team) {
			await this.postEphemeralMessage(
				this.payload.response_url,
				SlackInteractiveComponentBlocks.createMarkdownBlocks('Sorry, we couldn\'t find your team')
			);
			return undefined;
		}

		const blocks = await this.createModalBlocks(codemark, userThatClicked);
		let caughtSlackError = undefined;
		const users = [userThatCreated, userThatClicked];
		const modalErrors = [];
		for (let i = 0; i < users.length; i++) {
			caughtSlackError = false;
			const user = users[i];
			if (!user) continue;

			client = await this.tryCreateClient(user, this.payload.user);
			if (!client) continue;

			let modalResponse;
			try {
				modalResponse = await client.views.open({
					trigger_id: this.payload.trigger_id,
					view: SlackInteractiveComponentBlocks.createCodemarkModalView(
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
				} else if (modalResponse && modalResponse.error) {
					modalErrors.push(modalResponse.error);
				}
			} catch (ex) {
				this.log(ex);
				caughtSlackError = ex;
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
			const payloadString = JSON.stringify(this.actionPayload, redactView, 2);
			const errorReason = this.handleBlockActionReplyFail(secondsBetween, caughtSlackError, payloadString, modalErrors);

			return {
				actionUser: payloadActionUser,
				actionTeam: team,
				error: {
					eventName: 'Provider Reply Denied',
					reason: errorReason
				},
				payloadUserId: this.payload.user.id
			};
		}

		return {
			actionUser: payloadActionUser,
			actionTeam: team,
			payloadUserId: this.payload.user.id
		};
	}

	async handleBlockActionReviewReply () {
		let client;
		let payloadActionUser;
		let success = false;
		const timeStart = new Date();
		const review = await this.data.reviews.getById(this.actionPayload.rId);
		this.mergeReviewActionPayloadData(review);

		const team = await this.getTeamById(this.actionPayload.tId);
		if (!review) {
			await this.postEphemeralMessage(
				this.payload.response_url,
				SlackInteractiveComponentBlocks.createMarkdownBlocks('Sorry, we couldn\'t find that review')
			);
			return {
				error: {
					eventName: 'Provider Reply Denied',
					reason: 'OpenReviewReviewNotFound'
				}
			};
		}
		// we are getting two users, but only using one of their accessTokens.
		// this is to allow non Slack authed users to reply from slack wo/having CS
		const { userThatCreated, userThatClicked } = await this.getUsers();
		if (!userThatCreated && !userThatClicked) {
			return undefined;
		}

		payloadActionUser = userThatClicked;

		if (!team) {
			await this.postEphemeralMessage(
				this.payload.response_url,
				SlackInteractiveComponentBlocks.createMarkdownBlocks('Sorry, we couldn\'t find your team')
			);
			return undefined;
		}

		const blocks = await this.createReviewModalBlocks(review, userThatClicked);
		let caughtSlackError = undefined;
		const users = [userThatCreated, userThatClicked];
		const modalErrors = [];
		for (let i = 0; i < users.length; i++) {
			caughtSlackError = false;
			const user = users[i];
			if (!user) continue;

			client = await this.tryCreateClient(user, this.payload.user);
			if (!client) continue;

			let modalResponse;
			try {
				modalResponse = await client.views.open({
					trigger_id: this.payload.trigger_id,
					view: SlackInteractiveComponentBlocks.createReviewModalView(
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
				} else if (modalResponse && modalResponse.error) {
					modalErrors.push(modalResponse.error);
				}
			} catch (ex) {
				this.log(ex);
				caughtSlackError = ex;
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
			const payloadString = JSON.stringify(this.actionPayload, redactView, 2);
			const errorReason = this.handleBlockActionReplyFail(secondsBetween, caughtSlackError, payloadString, modalErrors);

			return {
				actionUser: payloadActionUser,
				actionTeam: team,
				error: {
					eventName: 'Provider Reply Denied',
					reason: errorReason
				},
				payloadUserId: this.payload.user.id
			};
		}

		return {
			actionUser: payloadActionUser,
			actionTeam: team,
			payloadUserId: this.payload.user.id
		};
	}

	async handleBlockActionReplyFail (secondsBetween, caughtSlackError, payloadString, modalErrors) {
		if (secondsBetween >= SLACK_TIMEOUT_SECONDS) {
			await this.postEphemeralMessage(
				this.payload.response_url,
				SlackInteractiveComponentBlocks.createMarkdownBlocks('We took too long to respond, please try again. ')
			);
			this.log(`Took too long to respond (${secondsBetween} seconds)`);
			return 'OpenCodemarkResponseTooSlow';
		}
		if (caughtSlackError) {
			await this.postEphemeralMessage(
				this.payload.response_url,
				SlackInteractiveComponentBlocks.createMarkdownBlocks('Oops, something happened. Please try again. ')
			);
			this.log(`Oops, something happened - Exception: ${caughtSlackError}\nView payload: ${payloadString}`);
			return 'OpenReviewGenericInternalError';
		}
		if (modalErrors.length) {
			await this.postEphemeralMessage(
				this.payload.response_url,
				SlackInteractiveComponentBlocks.createMarkdownBlocks('Oops, something happened. Please try again. ')
			);
			const errorString = modalErrors.join(', ');
			this.log(`Oops, something happened. Error: ${errorString}\nView payload: ${payloadString}`);
			return 'OpenReviewGenericResponseError';
		}
		await this.postEphemeralMessage(
			this.payload.response_url,
			SlackInteractiveComponentBlocks.createRequiresAccess()
		);
		this.log(`Was not able to show a modal (generic)\nView payload: ${payloadString}`);
		return 'OpenReviewGenericError';
	}

	async getUserWithoutTeam (slackUserId) {
		if (!slackUserId) return undefined;

		const users = await this.data.users.getByQuery(
			{
				providerIdentities: `slack::${slackUserId}`,
				deactivated: false
			},
			{ hint: UserIndexes.byProviderIdentities }
		);

		if (users.length > 1) {
			// this shouldn't really happen
			this.log(`Multiple CodeStream users found matching identity ${slackUserId}`);
			return undefined;
		}
		if (users.length === 1) {
			return users[0];
		}
		return undefined;
	}

	async getUser (slackUserId, codestreamTeamId) {
		if (!slackUserId || !codestreamTeamId) return undefined;

		const user = await this.getUserWithoutTeam(slackUserId);

		if (user && user.hasTeam(codestreamTeamId)) return user;

		return undefined;
	}

	async getFauxUser (codestreamTeamId, slackWorkspaceId, slackUserId) {
		if (!codestreamTeamId || !slackWorkspaceId || !slackUserId) return undefined;

		const query = { externalUserId: `slack::${codestreamTeamId}::${slackWorkspaceId}::${slackUserId}` };
		const users = await this.data.users.getByQuery(query,
			{ hint: UserIndexes.byExternalUserId }
		);

		if (users.length > 1) {
			// this shouldn't really happen
			this.log(`Multiple CodeStream users found matching identity slack workspaceId=${slackWorkspaceId} userId=${slackUserId} on codestream team=${codestreamTeamId}`);
			return undefined;
		}
		if (users.length === 1) {
			const user = users[0];
			if (user.get('deactivated')) return undefined;

			return user;
		}
		return undefined;
	}

	async getUserFromSlack (userId, accessToken) {
		const request = await Fetch(`https://slack.com/api/users.info?user=${userId}`,
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
			this.log(`getUserFromSlack error=${response.error}`);
			return undefined;
		}
		return response;
	}

	async getUserByEmail (emailAddress, codestreamTeamId) {
		if (!emailAddress) return undefined;

		const users = await this.data.users.getByQuery(
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

	async getTeamById (teamId) {
		if (!teamId) {
			this.log('Could not find teamId within the  action payload');
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

	async createModalBlocks (codemark, userThatClicked) {
		const slackUserExtra = userThatClicked && this.getSlackExtraData(userThatClicked);
		let replies;
		let postUsers;
		let userIds = [];
		if (this.actionPayload.ppId) {
			// slack blocks have a limit of 100, but we have 3 blocks for each reply...
			replies = await this.data.posts.getByQuery(
				{ parentPostId: this.actionPayload.ppId },
				{ hint: PostIndexes.byParentPostId, sort: { seqNum: 1 }, limit: 30 }
			);
			//  don't show replies that have been deleted
			if (replies && replies.length) {
				replies = replies.filter(_ => !_.get('deactivated'));
			}
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
		let blocks = [
			{
				type: 'context',
				elements: [{
					type: 'mrkdwn',
					text: `*${(codemarkUser && codemarkUser.get('username')) || 'Unknown User'}* ${this.formatTime(
						userThatClicked,
						codemark.get('createdAt'),
						slackUserExtra && slackUserExtra.tz
					)}`
				}]
			}
		];

		let codemarkText = codemark.get('text');
		let isTruncated = false;
		if (codemarkText && codemarkText.length) {
			isTruncated = codemarkText.length > 3000;
			codemarkText = codemarkText.substring(0, 2997) + '...';
		}
		if (codemarkText) {
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: codemarkText
				}
			});
			if (isTruncated) {
				blocks.push({
					type: 'context',
					elements: [{
						type: 'mrkdwn',
						text: 'This was partially truncated. Open in IDE to view it in full.'
					}]
				});
			}
		}
		if (codemark.get('markerIds') && codemark.get('markerIds').length) {
			const markers = await this.data.markers.getByIds(codemark.get('markerIds'));
			if (markers && markers.length) {
				for (const m of markers) {
					const file = m.get('file');
					// +1 for the newline
					const fileLength = file ? file.length + 1 : 0;
					blocks.push({
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `${file}\n\`\`\`${(m.get('code') || '').substring(0, 2994 - fileLength)}\`\`\``
						}
					});
				}
			}
		}

		blocks.push(SlackInteractiveComponentBlocks.createModalReplyBlock());

		this.createReplyBlocks(replies, usersById, userThatClicked, slackUserExtra, blocks, 0);
		return blocks;
	}

	async createReviewModalBlocks (review, userThatClicked) {
		const slackUserExtra = userThatClicked && this.getSlackExtraData(userThatClicked);
		let replies;
		let postUsers;
		let userIds = [];
		if (this.actionPayload.ppId) {
			// slack blocks have a limit of 100, but we have 5 blocks for each reply...
			replies = await this.data.posts.getByQuery(
				{ parentPostId: this.actionPayload.ppId },
				{ hint: PostIndexes.byParentPostId, sort: { seqNum: 1 }, limit: 20 }
			);
			let postIds;
			let repliesToReplies;
			//  don't show replies that have been deleted
			if (replies && replies.length) {
				replies = replies.filter(_ => !_.get('deactivated'));
				postIds = replies.map(post => post.id);
				repliesToReplies = await this.data.posts.getByQuery(
					{
						parentPostId: this.data.posts.inQuery(postIds),
						streamId: review.get('streamId').toLowerCase(),
						teamId: review.get('teamId').toLowerCase()
					},
					{
						hint: PostIndexes.byParentPostId
					}
				);
				replies.sort((a, b) => a.id.localeCompare(b.id));
				repliesToReplies.sort((a, b) => a.id.localeCompare(b.id));
			}
			if (repliesToReplies && repliesToReplies.length) {
				for (let i = 0; i < replies.length; i++) {
					const reply = replies[i];
					var children = repliesToReplies.filter(rtr => rtr.attributes.parentPostId == reply.id);
					if (children.length) {
						reply.attributes.children = children;
					}
				}
			}
			// get uniques
			userIds = [
				...new Set([
					...replies.map(_ => _.get('creatorId')),
					review.get('creatorId')
				])
			];
		} else {
			userIds = [review.get('creatorId')];
		}

		postUsers = await this.data.users.getByIds(userIds);
		const usersById = keyBy(postUsers, function (u) {
			return u.get('_id');
		});
		const codemarkUser = usersById[review.get('creatorId')];
		let blocks = [
			{
				type: 'context',
				elements: [{
					type: 'mrkdwn',
					text: `*${(codemarkUser && codemarkUser.get('username')) || 'Unknown User'}* ${this.formatTime(
						userThatClicked,
						review.get('createdAt'),
						slackUserExtra && slackUserExtra.tz
					)}`
				}]
			}
		];

		const text = review.get('text');
		if (text) {
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `${text}`
				}
			});
		}
		blocks.push(SlackInteractiveComponentBlocks.createModalReplyBlock());

		this.createReplyBlocks(replies, usersById, userThatClicked, slackUserExtra, blocks, 0);
		return blocks;
	}

	createIndent (indent) {
		if (indent <= 0) return '';
		// this is an empty/whitespace character, we're going to use it 
		// to fool Slack into creating an empty space
		const char = ' ';
		let result = '';
		for (let i = 0; i < indent * 5; i++) {
			result += char;
		}
		return result;
	}

	createReplyBlocks (replies, usersById, userThatClicked, slackUserExtra, blocks, indent) {
		if (!replies || !replies.length) return;
	
		const indentString = this.createIndent(indent);
		for (let i = 0; i < replies.length; i++) {
			const reply = replies[i];
			const replyUser = usersById[reply.get('creatorId')];
			const user = (replyUser && replyUser.get('username')) || 'An unknown user';
			let text = reply.get('text');

			if (text.startsWith('/me ')) {
				// if this was a "me message" -- treat it slightly differently 
				// (the webview treats these like a "system" message -- styled as inline)
				text = text.substring(4);
				blocks.push(
					{
						type: 'context',
						elements: [
							{
								type: 'mrkdwn',
								text: `*${user} ${text}* ${this.formatTime(
									userThatClicked,
									reply.get('createdAt'),
									slackUserExtra && slackUserExtra.tz
								)}`
							},
						]
					},
				);
			}
			else {
				blocks.push(
					{
						type: 'context',
						elements: [{
							type: 'mrkdwn',
							text: `${indentString}*${user}* ${this.formatTime(
								userThatClicked,
								reply.get('createdAt'),
								slackUserExtra && slackUserExtra.tz
							)}`
						}]
					},
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: `${indentString}${text}`
						}
					});
			}
			
			if (reply.attributes.children && reply.attributes.children.length) {
				indent++;
				this.createReplyBlocks(reply.attributes.children, usersById, userThatClicked, slackUserExtra, blocks, indent);
				indent--;
			} 
			
			if (i < replies.length - 1) {
				blocks.push(
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: ' '
						}
					},
					{
						type: 'divider'
					},
					{
						type: 'section',
						text: {
							type: 'mrkdwn',
							text: ' '
						}
					}
				);
			}
		}
	}

	async getUsers () {
		// this assumes 2 possible users
		// userThatCreated: user that created the post
		// userThatClicked: user that clicked on the post
		// it's possible that they're the same user

		let results = {};
		let found = false;
		const teamId = this.actionPayload.tId || this.actionPayload.teamId;
		// if the user that created is the same as the user that clicked, we only need 1 lookup
		if (this.actionPayload.pcuId === this.payload.user.id) {
			let user = await this.getCodeStreamUser(this.actionPayload.crId);
			if (user) {
				const accessToken = this.getAccessToken(user, this.actionPayload.tId, this.payload.user.team_id);
				if (accessToken) {
					results.userThatCreated = user;
					results.userThatClicked = user;
					found = true;
				}
			}
			else {
				this.log(`could not find user crId=${this.actionPayload.crId}`);
			}
		}
		if (!found) {
			const users = await Promise.all([
				// user that created the post (codestream userId)
				this.actionPayload.crId
					? this.getCodeStreamUser(this.actionPayload.crId)
					: undefined,
				//user that clicked on the button, based upon their slack id (aka have they authed with slack)
				this.payload.user.id
					? this.getUser(teamId, this.payload.user.id)
					: undefined
			]);
			results.userThatCreated = users[0];
			results.userThatClicked = users[1];
			if (results.userThatClicked && results.userThatClicked.get('externalUserId')) {
				results.userThatClickedIsFauxUser = true;
			}
			if (results.userThatCreated && !results.userThatClicked) {
				// if we still don't have a user that clicked, 
				// see if we can map the user that clicked by email address to someone already in codestream
				try {
					const accessToken = this.getAccessToken(results.userThatCreated, this.actionPayload.tId, this.payload.user.team_id);
					if (accessToken) {
						const slackUser = await this.getUserFromSlack(this.payload.user.id, accessToken);
						if (slackUser) {
							// this is a user that, at one time was on another team, but got invited to this team -- try to look them up via email
							const userThatClicked = slackUser.user && slackUser.user.profile && await this.getUserByEmail(slackUser.user.profile.email, this.actionPayload.tId);
							if (userThatClicked) {
								results.userThatClicked = userThatClicked;
								found = true;
							}
						}
					}
				}
				catch (ex) {
					this.log(ex.message);
				}
				if (!found) {
					// didn't find a user that clicked on the post... do we have a faux user for them?
					const fauxUser = await this.getFauxUser(this.actionPayload.tId, this.payload.user.team_id, this.payload.user.id);
					if (fauxUser) {
						results.userThatClicked = fauxUser;
						results.userThatClickedIsFauxUser = true;
						return results;
					}
				}
			}
		}

		return results;
	}

	getAccessToken (user, codestreamTeamId, slackWorkspaceId) {
		if (!user) return undefined;
		const slackProviderInfo = user.get('providerInfo')[codestreamTeamId].slack.multiple[slackWorkspaceId];
		if (slackProviderInfo) {
			return slackProviderInfo.accessToken;
		}
		return undefined;
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

	formatTime (user, timeStamp, timeZone) {
		const format = 'h:mm A MMM D';
		if (!timeZone) {
			timeZone = user && user.get('timeZone');
			if (!timeZone) {
				timeZone = 'Etc/GMT';
			}
		}
		let value = MomentTimezone.tz(timeStamp, timeZone).format(format);
		if (!timeZone || timeZone === 'Etc/GMT') {
			return `${value} UTC`;
		}
		return value;
	}
}

module.exports = SlackInteractiveComponentsHandler;
