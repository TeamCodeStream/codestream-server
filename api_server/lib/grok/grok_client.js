'use strict';

const { Client } = require('undici');
const Errors = require('./errors');
const NerdGraphOps = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/nerd_graph_ops');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');

class GrokClient {

	async analyzeErrorWithGrok (options) {
		Object.assign(this, options);
		['request', 'data', 'api', 'errorHandler', 'responseData', 'user', 'company'].forEach(x => this[x] = this.postRequest[x]);

		this.errorHandler.add(Errors);

		if (!!this.request.body.analyze) {
			this.promptTracking = 'unprompted';
		} else if (this.request.body.text.match(/@AI/gmi)) {
			this.promptTracking = 'prompted';
		}

		if (!this.request.body.teamId) {
			//design requires a Team
			return;
		}

		this.team = await this.data.teams.getById(this.request.body.teamId);

		if (!this.team) {
			// We need to find a way to send this issue back down so
			// the clients know there was an issue - otherwise, infinite spin.
			throw this.errorHandler.error('notFound', { info: 'team' });
		}

		let grokUserId = this.team.get('grokUserId');

		if (!grokUserId) {
			let grokUser = await this.createGrokUser();

			if (grokUser) {
				grokUserId = grokUser.id;
			}
		}

		this.topmostPost = await this.findTopMostPost();

		if (!this.topmostPost) {
			// We need to find a way to send this issue back down so
			// the clients know there was an issue - otherwise, infinite spin.
			throw this.errorHandler.error('notFound', { info: 'topmostPost' });
		}

		this.codeError = await this.data.codeErrors.getById(this.topmostPost.get('codeErrorId'));

		if (!this.codeError) {
			// We need to find a way to send this issue back down so
			// the clients know there was an issue - otherwise, infinite spin.
			throw this.errorHandler.error('notFound', { info: 'codeError' });
		}
		this.accountId = new NerdGraphOps().accountIdFromErrorGroupGuid(this.codeError.get('objectId'));

		const grokConversation = this.topmostPost.get('grokConversation');

		if (this.reinitializeGrok || !grokConversation) {
			await this.startNewConversation(grokUserId);
		} else {
			await this.continueConversation(grokConversation, grokUserId);
		}
	}

	async findTopMostPost () {
		let topmostPost;

		// in the case where we are reinitializing Grok, we won't be creating / returning
		// a post, so we'll skip this step but fall into the parentPostId check below
		if (this.responseData && this.responseData.post && this.responseData.post.id) {
			topmostPost = await this.data.posts.getById(this.responseData.post.id);
		}

		if (this.request.body.parentPostId) {
			topmostPost = await this.data.posts.getById(this.request.body.parentPostId);
			const topmostParentPostId = topmostPost.get('parentPostId');

			if (topmostParentPostId && topmostParentPostId !== this.request.body.parentPostId) {
				topmostPost = await this.data.posts.getById(topmostPost.parentPostId);
			}
		}

		return topmostPost;
	}

	async continueConversation (grokConversation, grokUserId) {
		const conversation = grokConversation;

		const parentPostIds = [this.request.body.parentPostId];
		if (this.request.body.parentPostId !== this.topmostPost.get('id')) {
			parentPostIds.push(this.topmostPost.get('id'));
		}

		const posts = await this.data.posts.getByQuery(
			{
				parentPostId: { $in: parentPostIds },
				forGrok: true,
				deactivated: false,
			},
			{
				hint: PostIndexes.byParentPostId,
			}
		);

		// sort by createdAt, oldest first
		posts.sort((a, b) => {
			return a.get('createdAt') - b.get('createdAt');
		});

		// 20 is the max number of posts we can send to Grok,
		// so 17 from here plus the 2 stored in grokConversation,
		// plus the new one we're about to send = 20
		const limitedPosts = posts.slice(0, 17);

		limitedPosts.forEach(p => {
			conversation.push({
				role: p.get('promptRole'),
				content: p.get('text')
			});
		});

		conversation.push({
			role: 'user',
			content: this.request.body.text
		});

		const postCreator = new PostCreator({
			request: this.postRequest,
			team: this.team
		});

		// Store Grok response as new Post - text will be populated via streaming -> pubnub
		const grokResponsePost = await postCreator.createPost({
				forGrok: true,
				streamId: this.codeError.get('streamId'),
				teamId: this.team.get('id'),
				text: '',
				promptRole: 'system',
				parentPostId: this.topmostPost.get('id'),
				codeError: this.codeError.get('id')
			},
			{
				overrideCreatorId: grokUserId
			});

		await this.postRequest.postProcessPersist();

		await this.broadcastToUser({
			posts: [
				grokResponsePost.getSanitizedObject({ request: this.postRequest })
			]
		});

		let apiResponse;
		try {
			// NOTE: This call will ultimately stream chunks back to client through pubnub.
			// The 'apiResponse' here is the full response, not just individual chunks.
			apiResponse = await this.submitConversationToGrok(grokResponsePost, conversation, grokUserId);
		} catch (ex) {
			const message = ex?.reason?.message || ex.message;
			const postId = grokResponsePost.get('id');
			const streamId = grokResponsePost.get('streamId');
			await this.logExceptionAndDispatch(message, postId, streamId);
			throw ex;
		}

		// TODO this or PostUpdater?
		// Update the grok response post with final content from streaming response
		await new ModelSaver({
			request: this.postRequest,
			collection: this.data.posts,
			id: grokResponsePost.id,
		}).save({
			$set: {
				text: apiResponse.content,
			}
		});

		await this.postRequest.postProcessPersist();

		const sanitizedGrokPost = grokResponsePost.getSanitizedObject({ request: this.postRequest });
		await this.broadcastToTeam({
			post: sanitizedGrokPost
		});

		await this.trackPost();
	}

	async startNewConversation (grokUserId) {
		// get the last stack trace we have - text is full stack trace, split it into lines
		const stackTraceLines = (this.codeError.get('stackTraces') || [])
			.slice(-1)
			.pop()
			.text
			.split(/\r?\n/);

		// limit to 30 lines
		const totalStackTraceLines = Math.min(stackTraceLines.length, 30);

		// join the first 30 lines back together
		const stackTrace = stackTraceLines
			.slice(0, totalStackTraceLines)
			.join('\n');

		if (!stackTrace) {
			await this.logExceptionAndDispatch('Unable to locate an associated Stack Trace');
			throw this.errorHandler.error('notFound', { info: 'stackTrace' });
		}

		const code = this.request.body.codeBlock;
		const language = this.request.body.language;

		const errorText = `${this.codeError.get('title')} ${this.codeError.get('text')}`;

		let content = '';

		if (language) {
			content += `\ncoding language: ${language}\n`;
		}

		content += `Analyze this stack trace:\n\`\`\`\n${errorText}\n${stackTrace}\n\`\`\`\n`;

		if (code) {
			content += `\nAnd fix the following code:\n\`\`\`\n${code}\n\`\`\``;
		}

		const initialPrompt = [
			{
				role: 'system',
				content: this.api.config.integrations.newrelicgrok.prompt
			},
			{
				role: 'user',
				content: content
			}
		];

		const postCreator = new PostCreator({
			request: this.postRequest,
			team: this.team
		});

		// Store Grok response as new Post - text will be populated via streaming -> pubnub
		const grokResponsePost = await postCreator.createPost({
				forGrok: true,
				streamId: this.codeError.get('streamId'),
				teamId: this.team.get('id'),
				text: '',
				promptRole: 'system',
				parentPostId: this.topmostPost.get('id'),
				codeError: this.codeError.get('id')
			},
			{
				overrideCreatorId: grokUserId
			});

		await this.postRequest.postProcessPersist();

		await this.broadcastToUser({
			posts: [
				grokResponsePost.getSanitizedObject({ request: this.postRequest })
			]
		});

		let apiResponse;
		try {

			// NOTE: This call will ultimately stream chunks back to client through pubnub.
			// The 'apiResponse' here is the full response, not just individual chunks.
			apiResponse = await this.submitConversationToGrok(grokResponsePost, initialPrompt, grokUserId);
		} catch (ex) {
			const message = ex?.reason?.message || ex.message;
			const postId = grokResponsePost.get('id');
			const streamId = grokResponsePost.get('streamId');
			await this.logExceptionAndDispatch(message, postId, streamId);
			throw ex;
		}

		// Update initial parent post with the current conversation.
		const updatedPost = await new ModelSaver({
			request: this.postRequest,
			collection: this.data.posts,
			id: this.topmostPost.get('id')
		}).save({
			$set: {
				grokConversation: initialPrompt,
				forGrok: true
			}
		});

		// TODO this or PostUpdater?
		// Update the grok response post with final content from streaming response
		await new ModelSaver({
			request: this.postRequest,
			collection: this.data.posts,
			id: grokResponsePost.id,
		}).save({
			$set: {
				text: apiResponse.content,
			}
		});

		await this.postRequest.postProcessPersist();

		// client does NOT need this and it could be enormous; save those bytes
		delete updatedPost.$set.grokConversation;

		const sanitizedGrokPost = grokResponsePost.getSanitizedObject({ request: this.postRequest });
		await this.broadcastToTeam({
			posts: [
				sanitizedGrokPost,
				updatedPost
			]
		});

		await this.trackPost();
	}

	async broadcastToUser (message) {
		const channel = `user-${this.user.id}`;

		await this.broadcast(message, channel);
	}

	async broadcastToTeam (message) {
		const channel = `team-${this.team.get('id')}`;

		await this.broadcast(message, channel);
	}

	async broadcast (message, channel) {
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.postRequest }
			);
		} catch (error) {
			this.api.logger.warn(`Could not publish post message to channel ${channel}: ${JSON.stringify(error)}`, this.postRequest.id);
		}
	}

	async createGrokUser () {
		const teamId = this.team.get('id');

		const userCreator = new UserCreator({
			request: this.postRequest,
			teamIds: [teamId],
			companyIds: [this.team.get('companyId')],
			userBeingAddedToTeamId: teamId,
			dontSetInviteType: true,
			dontSetInviteCode: true,
			ignoreUsernameOnConflict: true
		});

		const grokUser = await userCreator.createUser({
			username: 'AI',
			avatar: {
				image: 'https://images.codestream.com/icons/grok-green.png'
			}
		});

		const grokUserId = grokUser.get('id');

		const teamUpdate = {
			$addToSet: {
				memberIds: [grokUserId],
			},
			$pull: {
				removedMemberIds: [grokUserId],
				foreignMemberIds: [grokUserId]
			},
			$set: {
				modifiedAt: Date.now(),
				grokUserId: grokUser.get('id')
			}
		};

		await new ModelSaver({
			request: this.postRequest,
			collection: this.data.teams,
			id: teamId
		}).save(teamUpdate);

		await this.postRequest.postProcessPersist();

		this.team = await this.data.teams.getById(teamId);

		await this.broadcastToTeam({
			user: grokUser.getSanitizedObject({ request: this.postRequest }),
			team: this.team.getSanitizedObject({ request: this.postRequest })
		});

		return grokUser;
	}

	async submitConversationToGrok (post, conversation, grokUserId, temperature = 0) {
		if (this.api.config.apiServer.mockMode) {
			return {
				role: 'assistant',
				content: 'Skipped API Call'
			};
		}

		const request = {
			model: this.api.config.integrations.newrelicgrok.model,
			messages: conversation,
			temperature: temperature,
			stream: true
		};

		let responseContent = '';
		let responseRole = '';

		const { origin, pathname } = new URL(this.api.config.integrations.newrelicgrok.apiUrl);

		const client = new Client(origin);

		let sequence = 0;

		try {
			const { statusCode, body } = await client.request({
				method: 'POST',
				path: pathname,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.api.config.integrations.newrelicgrok.apiKey}`
				},
				body: JSON.stringify(request),
			});

			if (statusCode !== 200) {
				await this.trackErrorAndThrow('apiException', {
					request,
					statusCode,
					message: `Request failed with status code: ${statusCode}`
				});
			}

			// Chunks can be incomplete (probably a bug we can work around it)
			let buffer = '';

			for await (const chunk of body) {
				if (!chunk) {
					continue;
				}

				const chunkString = chunk.toString();
				buffer = buffer ? buffer + chunkString : chunkString;

				// Server-sent events spec ends a series of events with two newlines
				if (!buffer.endsWith('\n\n')) {
					continue;
				}

				const rows = buffer.split('\n');

				// We have the full event in rows now, we can clear buffer for next chunk
				buffer = '';

				let broadcastContent = "";

				for (let row of rows) {
					// row = row.replace(/\n/g, "").trim();
					if (!row) {
						continue;
					}

					const line = row.replace(/data: /, '')?.trim();

					if (!line || line === '[DONE]') {
						continue;
					}

					let chonk = undefined;
					try {
						chonk = JSON.parse(line);
					} catch (err) {
						this.api.logger.warn(`Could not parse JSON from AI: "${line}"" \n${chunkString}`);
						continue;
					}

					if (!chonk || !chonk.choices || !chonk.choices[0]) {
						continue;
					}

					const role = chonk.choices[0].delta?.role;

					if (role && !responseRole) {
						responseRole = role;
					}

					const content = chonk.choices[0].delta?.content;

					if (content) {
						// Collect the totality of all the content for the entire stream to persist to mongo
						// for final version if post
						responseContent += content;
						// Gather the content from all the server events in this chunk
						broadcastContent = broadcastContent + content;
					}
				}
				// Now that we have all the events processed for this chunk we can send them in 1 pubnub broadcast
				await this.broadcastToUser({ grokStream: {
					sequence: sequence++,
					content: {
						content: broadcastContent,
						role: responseRole,
					},
					extra: {
						topmostPostId: this.topmostPost.get('id'),
						codeErrorId: this.codeError.get('id'),
						postId: post.get('id'),
						streamId: post.get('streamId'),
					}
					} });
			}

			// Broadcast done event
			await this.broadcastToUser({
				grokStream: {
					extra: {
						topmostPostId: this.topmostPost.get('id'),
						codeErrorId: this.codeError.get('id'),
						postId: post.get('id'),
						streamId: post.get('streamId'),
						done: true
					}
				}
			});

			return {
				content: responseContent,
				role: responseRole
			};
		} catch (err) {
			await this.trackErrorAndThrow('apiException', {
				request,
				message: `Error getting AI response: ${err.message}`
			});
			await this.broadcastToUser({
				grokStream: {
					sequence: sequence++,
					extra: {
						done: true
					}
				}
			});
		} finally {
			client.close();
		}
	}

	async trackErrorAndThrow (errorKey, data) {
		const { postRequest, user, team, company } = this;

		const trackData = {
			event_type: 'response',
			account_id: this.accountId,
			meta_data: `item_guid: ${this.codeError.get('objectId')}`
		};

		await this.api.services.analytics.trackWithSuperProperties(
			'codestream/grok_response failed',
			trackData,
			{ request: postRequest, user, team, company }
		);

		throw this.errorHandler.error(errorKey, { ...data, ...trackData });
	}

	async logExceptionAndDispatch (message, postId, streamId) {
		const topmostPostId = this.topmostPost.get('id');
		const codeErrorId = this.codeError.get('id');

		const trackData = {
			'Parent ID': topmostPostId,
			'Code Error ID': codeErrorId
		};

		await this.postRequest.reportError({ message, logSummary: JSON.stringify(trackData) });

		await this.broadcastToUser({
			asyncError: {
				type: 'grokException',
				extra: {
					codeErrorId: codeErrorId,
					topmostPostId: topmostPostId,
					postId: postId,
					streamId: streamId,
				},
				errorMessage: message
			}
		});
	}

	async trackPost () {
		const { postRequest, user, team, company } = this;

		const trackData = {
			event_type: 'response',
			account_id: this.accountId,
			meta_data: `response_type: ${this.promptTracking}`
		};

		await this.api.services.analytics.trackWithSuperProperties(
			'codestream/grok_response generated',
			trackData,
			{ request: postRequest, user, team, company }
		);
	}
}

module.exports = GrokClient;

