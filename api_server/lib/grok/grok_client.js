'use strict';

const fetch = require('node-fetch');
const Errors = require('./errors');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');

class GrokClient {

	async analyzeErrorWithGrok(options) {
		Object.assign(this, options);
		['request', 'data', 'api', 'errorHandler', 'responseData', 'user', 'company'].forEach(x => this[x] = this.postRequest[x]);

		this.errorHandler.add(Errors);

		if(!!this.request.body.analyze){
			this.promptTracking = 'Unprompted'; 
		}
		else if(this.request.body.text.match(/\@Grok/gmi)){
			this.promptTracking = 'Prompted'; 
		}

		if(!this.request.body.teamId){
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

		if(!grokUserId) {
			let grokUser = await this.createGrokUser();

			if(grokUser){
				grokUserId = grokUser.id;
			}
		}

		this.topmostPost = await this.findTopMostPost();

		if (!this.topmostPost) {
			// We need to find a way to send this issue back down so
			// the clients know there was an issue - otherwise, infinite spin.
			throw this.errorHandler.error('notFound', { info: 'topmostPost' });
		}

		const grokConversation = this.topmostPost.get('grokConversation');

		if(this.reinitializeGrok || !grokConversation){
			await this.startNewConversation(grokUserId);
		}
		else {
			await this.continueConversation(grokConversation, grokUserId);
		}
	}

	async findTopMostPost() {
		let topmostPost;

		// in the case where we are reinitializing Grok, we won't be creating / returning
		// a post, so we'll skip this step but fall into the parentPostId check below
		if (this.responseData && this.responseData.post && this.responseData.post.id) {
			topmostPost = await this.data.posts.getById(this.responseData.post.id);
		}

		if (this.request.body.parentPostId) {
			topmostPost = await this.data.posts.getById(this.request.body.parentPostId);
			const topmostParentPostId = topmostPost.get('parentPostId');
	
			if(topmostParentPostId && topmostParentPostId !== this.request.body.parentPostId){
				topmostPost = await this.data.posts.getById(topmostPost.parentPostId);
			}
		}

		return topmostPost;
	}

	async continueConversation(grokConversation, grokUserId){
		const conversation = grokConversation;
		const codeError = await this.data.codeErrors.getById(this.topmostPost.get('codeErrorId'));

		if (!codeError) {
			// We need to find a way to send this issue back down so
			// the clients know there was an issue - otherwise, infinite spin.
			throw this.errorHandler.error('notFound', { info: 'codeError' });
		}

		const parentPostIds = [this.request.body.parentPostId];
		if(this.request.body.parentPostId !== this.topmostPost.get('id')){
			parentPostIds.push(this.topmostPost.get('id'));
		}

		const posts = await this.data.posts.getByQuery(
			{
				parentPostId: { $in: parentPostIds },
				forGrok: true
			},
			{
				hint: PostIndexes.byParentPostId,
			}
		);

		// sort by createdAt, oldest first
		posts.sort((a, b) => {
			return a.get('createdAt') - b.get('createdAt');
		})

		// 20 is the max number of posts we can send to Grok, 
		// so 17 from here plus the 2 stored in grokConversation,
		// plus the new one we're about to send = 20
		const limitedPosts = posts.slice(0, 17);

		limitedPosts.forEach(p => {
			conversation.push({
				role: p.get('promptRole'),
				content: p.get('text')
			})
		});

		conversation.push({
			role: "user",
			content: this.request.body.text
		});

		let apiResponse;
		try{
			apiResponse = await this.submitConversationToGrok(conversation);
		}
		catch(ex) {
			const message = ex?.reason?.message || ex.message;
			await this.logExceptionAndDispatch(message, codeError);
			throw ex;
		}
		
		const postCreator = new PostCreator({
			request: this.postRequest,
			team: this.team
		});

		// store Grok response as new Post
		const post = await postCreator.createPost({
			forGrok: true,
			streamId: codeError.get('streamId'),
			teamId: this.team.get('id'),
			text: apiResponse.content,
			promptRole: apiResponse.role,
			parentPostId: this.topmostPost.get('id'),
			codeError: codeError.get('id')
		},
		{
			overrideCreatorId: grokUserId
		});

		await this.broadcastToTeam({
			post: post.getSanitizedObject({ request: this.postRequest })
		});

		await this.trackPost(codeError);
	}

	async startNewConversation(grokUserId) {
		const codeError = await this.data.codeErrors.getById(this.topmostPost.get('codeErrorId'));
		if (!codeError) {
			// We need to find a way to send this issue back down so
			// the clients know there was an issue - otherwise, infinite spin.
			throw this.errorHandler.error('notFound', { info: 'codeError' });
		}

		// get the last stack trace we have - text is full stack trace, split it into lines
		const stackTraceLines = (codeError.get('stackTraces') || [])
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
			await this.logExceptionAndDispatch("Unable to locate an associated Stack Trace", codeError);
			throw this.errorHandler.error('notFound', { info: 'stackTrace' });
		}

		const code = this.request.body.codeBlock;

		let content = `Analyze this stack trace:\n\`\`\`\n${ stackTrace }\n\`\`\`\n`
		
		if(code){
			content += `\nAnd fix the following code:\n\`\`\`\n"${ code }"\n\`\`\``;
		}

		const initialPrompt = [{
			role: "system",
			content: "As a coding expert I am helpful and very knowledgeable about how to fix errors in code. I will be given errors, stack traces, and code snippets to analyze and fix. I will output brief descriptions and the fixed code blocks."
		},
		{
			role: "user", 
			content: content
		}];

		let apiResponse;
		try{
			apiResponse = await this.submitConversationToGrok(initialPrompt);
		}
		catch(ex){
			const message = ex?.reason?.message || ex.message;
			await this.logExceptionAndDispatch(message, codeError);
			throw ex;
		}

		// Update initial post with the current conversation.
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

		await this.postRequest.postProcessPersist();

		const postCreator = new PostCreator({
			request: this.postRequest,
			team: this.team
		});

		// store Grok response as new Post 
		const post = await postCreator.createPost({
			forGrok: true,
			streamId: codeError.get('streamId'),
			teamId: this.team.get('id'),
			text: apiResponse.content,
			promptRole: apiResponse.role,
			parentPostId: this.topmostPost.get('id'),
			codeError: codeError.get('id')
		},
		{
			overrideCreatorId: grokUserId
		});

		// client does NOT need this and it could be enormous; save those bytes
		delete updatedPost.$set.grokConversation;

		await this.broadcastToTeam({
			posts: [
				post.getSanitizedObject({ request: this.postRequest }),
				updatedPost
			]
		});

		await this.trackPost(codeError);
	}

	async broadcastToUser(message){
		const channel = `user-${this.user.id}`;

		await this.broadcast(message, channel);
	}

	async broadcastToTeam(message){
		const channel = `team-${this.team.get('id')}`;

		await this.broadcast(message, channel);
	}

	async broadcast(message, channel){
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.postRequest }
			);
		}
		catch (error) {
			this.api.logger.warn(`Could not publish post message to channel ${channel}: ${JSON.stringify(error)}`, this.postRequest.id);
		}
	}

	async createGrokUser() {
		const teamId = this.team.get('id');

		const userCreator = new UserCreator({
			request: this.postRequest,
			teamIds: [teamId],
			companyIds: [this.team.get('companyId')],
			userBeingAddedToTeamId: teamId,
			dontSetInviteType: true,
			dontSetInviteCode: true,
			ignoreUsernameOnConflict: true
		})
		
		const grokUser = await userCreator.createUser({
			username: "Grok",
			avatar: {
				image: "https://images.codestream.com/icons/grok-green.png"
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

	async submitConversationToGrok(conversation, temperature = 0){
		if(this.api.config.apiServer.mockMode){
			return {
				role: "assistant",
				content: "Skipped API Call"
			}
		}
		
		const request = {
			model: "gpt-35-turbo",
			messages: conversation,
			temperature: temperature
		};

		let response;
		try{
			response = await fetch(this.api.config.integrations.newrelicgrok.apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${this.api.config.integrations.newrelicgrok.apiKey}`,
				},
				body: JSON.stringify(request),
			});

			const apiResponse = await response.json();

			if (apiResponse && apiResponse.error) {
				await this.trackErrorAndThrow('apiResponseContainedError', {apiResponse});
			}
		
			if (apiResponse && apiResponse.choices && !apiResponse.choices[0]) {
				await this.trackErrorAndThrow('apiResponseContainedNoChoice', {apiResponse});
			}
		
			const message = apiResponse.choices[0].message;
			if (!message) {
				await this.trackErrorAndThrow('apiResponseContainedNoChoiceMessage', {apiResponse});
			}

			return message;
		}
		catch (err) {
			await this.trackErrorAndThrow('apiException', {request, response, message: `Error parsing Grok response: ${err.message}`});
		}
	}

	async trackErrorAndThrow(errorKey, data) {
		const { postRequest, user, team, company } = this;

		let errorCode = Errors[errorKey].code;

		const trackData = {
			'Parent ID': this.topmostPost.get('id'),
			'Code Error ID': this.topmostPost.get('codeErrorId'),
			'Error Code': errorCode,
		}

		await this.api.services.analytics.trackWithSuperProperties(
			'Grok Response Failed',
			trackData,
			{ request: postRequest, user, team, company }
		);

		throw this.errorHandler.error(errorKey, { ...data, ...trackData });
	}

	async logExceptionAndDispatch(message, codeError){
		const topmostPostId = this.topmostPost.get('id');
		const codeErrorId = codeError.get('id');

		const trackData = {
			'Parent ID': topmostPostId,
			'Code Error ID': codeErrorId
		}

		await this.postRequest.reportError({message, logSummary: JSON.stringify(trackData)});

		await this.broadcastToUser({
			asyncError: {
				type: 'grokException',
				extra: {
					codeErrorId: codeErrorId,
					topmostPostId: topmostPostId,
				},
				errorMessage: message
			}
		});
	}

	async trackPost (codeError) {
		const { postRequest, user, team, company } = this;

		const codeErrorId = codeError.get('id');

		const trackData = {
			'Parent ID': codeErrorId,
			'Parent Type': 'Error',
			'Grok Post': this.promptTracking,
		};
		
		await this.api.services.analytics.trackWithSuperProperties(
			'Reply Created',
			trackData,
			{ request: postRequest, user, team, company }
		);
	}
}

module.exports = GrokClient;

