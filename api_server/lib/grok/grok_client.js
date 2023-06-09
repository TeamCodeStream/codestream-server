'use strict';

const fetch = require('node-fetch');
const Errors = require('./errors');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');

class GrokClient {

	async analyzeErrorWithGrok(options) {
		Object.assign(this, options);
		['request', 'data', 'api', 'errorHandler', 'responseData'].forEach(x => this[x] = this.postRequest[x]);

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
			await this.broadcastToUser({
				asyncError: {
					type: 'grokException',
					extra: {
						codeErrorId: codeError.get('id'),
						topmostPostId: this.topmostPost.get('id'),
					},
					errorMessage: message
				}
			});
			throw ex;
		}
		
		const postCreator = new PostCreator({
			request: this.postRequest,
			team: this.team
		});

		// store Grok response as new Post
		const post = await postCreator.createPost({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.team.get('id'),
			text: apiResponse.content,
			promptRole: apiResponse.role,
			parentPostId: this.topmostPost.get('id'),
			codeError: codeError.get('id')
		},
		{
			promptTracking: this.promptTracking,
			overrideCreatorId: grokUserId
		});

		this.broadcastToTeam({
			post: post.attributes
		 });
	}

	async startNewConversation(grokUserId) {
		const codeError = await this.data.codeErrors.getById(this.topmostPost.get('codeErrorId'));
		if (!codeError) {
			throw this.errorHandler.error('notFound', { info: 'codeError' });
		}

		// get the last stack trace we have - text is full stack trace
		const stackTrace = (codeError.get('stackTraces') || []).slice(-1).pop().text;
		const code = this.request.body.codeBlock;

		const initialPrompt = [{
			role: "system",
			content: "As a coding expert I am helpful and very knowledgeable about how to fix errors in code. I will be given errors, stack traces, and code snippets to analyze and fix. I will output brief descriptions and the fixed code blocks."
		},
		{
			role: "user", 
			content: `Analyze this stack trace:\n\`\`\`\n"${ stackTrace }"\n\`\`\`\nAnd fix the following code:\n\`\`\`\n"${ code }"\n\`\`\``
		}];

		let apiResponse;
		try{
			apiResponse = await this.submitConversationToGrok(initialPrompt);
		}
		catch(ex){
			const message = ex?.reason?.message || ex.message;
			await this.broadcastToUser({
				asyncError: {
					type: 'grokException',
					extra: {
						codeErrorId: codeError.get('id'),
						topmostPostId: this.topmostPost.get('id'),
					},
					errorMessage: message
				}
			});

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

		this.postRequest.postProcessPersist();

		const postCreator = new PostCreator({
			request: this.postRequest,
			team: this.team
		});

		// store Grok response as new Post 
		const post = await postCreator.createPost({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.team.get('id'),
			text: apiResponse.content,
			promptRole: apiResponse.role,
			parentPostId: this.topmostPost.get('id'),
			codeError: codeError.get('id')
		},
		{
			promptTracking: this.promptTracking,
			overrideCreatorId: grokUserId
		});

		// client does NOT need this and it could be enormous; save those bytes
		delete updatedPost.$set.grokConversation;

		await this.broadcastToTeam({
			posts: [
				post.attributes,
				updatedPost
			]
		});
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
		const userCreator = new UserCreator({
			request: this.postRequest,
			teamIds: [this.team.get('id')],
			companyIds: [this.team.get('companyId')],
			userBeingAddedToTeamId: this.team.get('id'),
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

		await new AddTeamMembers({
			request: this.postRequest,
			addUsers: [grokUser],
			team: this.team
		}).addTeamMembers();

		await new ModelSaver({
			request: this.postRequest,
			collection: this.data.teams,
			id: this.team.get('id')
		}).save({
			$set: {
				grokUserId: grokUser.get('id')
			}
		});

		await this.broadcastToTeam({
			user: grokUser.attributes
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
		}
		catch(err){
			this.trackErrorAndThrow('apiException', err.message);
		}
	
		const apiResponse = await response.json();

		if (apiResponse && apiResponse.error) {
			this.trackErrorAndThrow('apiResponseContainedError', apiResponse.error);
		}
	
		if (apiResponse && apiResponse.choices && !apiResponse.choices[0]) {
			this.trackErrorAndThrow('apiResponseContainedNoChoice');
		}
	
		const message = apiResponse.choices[0].message;
		if (!message) {
			this.trackErrorAndThrow('apiResponseContainedNoChoiceMessage');
		}

		return message;
	}

	trackErrorAndThrow(errorKey, additionalMessage = '') {
		const { postRequest, user, team } = this;

		let errorCode = Errors[errorKey].code;

		const trackData = {
			'Parent ID': this.topmostPost.get('id'),
			'Code Error ID': this.topmostPost.get('codeErrorId'),
			'Error Code': errorCode,
		}

		this.api.services.analytics.trackWithSuperProperties(
			'Grok Response Failed',
			trackData,
			{ postRequest, user, team }
		);

		throw this.errorHandler.error(errorKey, { reason: additionalMessage });
	}
}

module.exports = GrokClient;

