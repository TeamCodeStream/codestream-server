'use strict';

const fetch = require('node-fetch');
const Errors = require('./errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');

class GrokClient {

	constructor(options){
		Object.assign(this, options);
	}

	async analyzeErrorWithGrok(config) {
		Object.assign(this, config);

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

		let grokUserId = this.team.get('grokUserId');

		if(!grokUserId) {
			let grokUser = await this.createGrokUser();

			if(grokUser){
				grokUserId = grokUser.get('id');
			}
		}

		let topmostPost = await this.data.posts.getById(this.responseData.post.id);

		if(this.request.body.parentPostId){
			topmostPost = await this.data.posts.getById(this.request.body.parentPostId);

			if(topmostPost && topmostPost.get('parentPostId') !== this.request.body.parentPostId){
				topmostPost = await this.data.posts.getById(topmostPost.parentPostId);
			}
		}

		const grokConversation = topmostPost.get('grokConversation');

		if(grokConversation){
			await this.continueConversation(grokConversation, grokUserId, topmostPost);
		}
		else {
			await this.startNewConversation(grokUserId, topmostPost);
		}
	}

	async continueConversation(grokConversation, grokUserId, topmostPost){
		const conversation = [grokConversation];
		
		const parentPostIds = [this.request.body.parentPostId];
		if(this.request.body.parentPostId !== topmostPost.get('id')){
			parentPostIds.push(topmostPost.get('id'));
		}

		const posts = await this.data.posts.getByQuery(
			{
				parentPostId: { $in: parentPostIds },
				forGrok: true
			},
			{
				fields: ['text', 'promptRole'],
				sort: { createdAt: 1},
				hint: PostIndexes.byParentPostId,
			}
		);

		posts.map(p => {
			conversation.push({
				role: p.promptRole,
				content: p.text
			})
		});

		const response = await this.submitConversationToGrok(conversation);
		
		const post = await this.creator.createModel({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.team.id,
			text: response.content,
			promptRole: response.role,
			parentPostId: topmostPost.id,
			codeError: this.response.initialResponseData.codeError.id,
			creatorId: grokUserId
		},
		{
			promptTracking: this.promptTracking
		});

		this.broadcast({
			posts: [post]
		});
	}

	async startNewConversation(grokUserId, topmostPost) {
		const codeError = await this.data.codeErrors.getById(topmostPost.get('codeErrorId'));

		// get the last stack trace we have - text is full stack trace
		const stackTrace = codeError.get('stackTraces').slice(-1).pop().text ?? "stack trace";
		const code = this.request.body.codeBlock ?? "code";

		const conversation = [{
			role: "system",
			content: "As a coding expert I am helpful and very knowledgeable about how to fix errors in code. I will be given errors, stack traces, and code snippets to analyze and fix. I will output brief descriptions and the fixed code blocks."
		},
		{
			role: "user", 
			content: `Analyze this stack trace:\n"${ stackTrace }"\nAnd fix the following code:\n"${ code }"\n`
		}];

		var response = await this.submitConversationToGrok(conversation);

		conversation.push({
			role: response.role,
			content: response.content
		});

		// Update initial post with the current conversation.
		await new ModelSaver({
			request: this.request,
			collection: this.data.posts,
			id: topmostPost.get('id')
		}).save({
			$set: {
				grokConversation: conversation
			}
		});
		
		// store Grok response as new Post 
		const post = await this.creator.createModel({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.team.get('id'),
			text: response.content,
			promptRole: response.role,
			parentPostId: topmostPost.get('id'),
			codeError: codeError.get('id'),
			creatorId: grokUserId
		},
		{
			promptTracking: this.promptTracking
		});

		await this.broadcast({
			posts: [post]
		});
	}

	async broadcast(message){
		const channel = `team-${this.team.get('id')}`;

		try {
			await this.request.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish post message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	async createGrokUser() {
		const userCreator = new UserCreator({
			request: this,
			teamIds: [this.team.get('id')],
			companyIds: [this.team.get('companyId')],
			userBeingAddedToTeamId: this.team.get('id'),
			dontSetInviteType: true,
			dontSetInviteCode: true,
			ignoreUsernameOnConflict: true
		})
		
		let grokUser = await userCreator.createUser({
			username: "Grok"
		});

		await new AddTeamMembers({
			request: this,
			addUsers: [grokUser],
			team: this.team
		}).addTeamMembers();

		await new ModelSaver({
			request: this,
			collection: this.data.teams,
			id: this.team.get('id')
		}).save({
			$set: {
				grokUserId: grokUser.get('id')
			}
		});

		await this.broadcast({
			users: [grokUser]
		});

		return grokUser;
	}

	async submitConversationToGrok(conversation, temperature = 0){
		const request = {
			messages: conversation,
			temperature: temperature
		};

		console.log(`CONFIG: ${JSON.stringify(this.api.config.integrations)}`);
		
		const response = await fetch(this.api.config.integrations.newrelicgrok.apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"api-key": `${this.api.config.integrations.newrelicgrok.apiKey}`,
			},
			body: JSON.stringify(request),
		});
	
		const apiResponse = await response.json();

		if (apiResponse && apiResponse.error) {
			throw this.errorHandler.error('apiError', { reason: apiResponse.error });
		}
	
		if (apiResponse && apiResponse.choices && apiResponse.choices.length === 0) {
			throw this.errorHandler.error('noChoices');
		}
	
		const message = apiResponse.choices[0].message;
		if (!message) {
			throw this.errorHandler.error('choiceNoMessage');
		}

		return message;
	}
}

module.exports = GrokClient;

