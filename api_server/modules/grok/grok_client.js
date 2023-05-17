'use strict';

const fetch = require('node-fetch');
const Errors = require('./errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');
const CodeErrorIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/indexes');

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
			//design calls for a Team
			return;
		}
		
		this.team = await this.data.teams.getById(this.request.body.teamId);

		let grokUserId = this.team.grokUserId;

		if(!grokUserId) {
			grokUserId = await this.createGrokUser().id;
		}

		let topmostPost = this.response.post;

		if(this.request.body.parentPostId){
			topmostPost = await this.data.posts.getById(this.request.body.parentPostId);
		
			if(topmostPost.parentPostId && topmostPost.parentPostId !== this.request.body.parentPostId){
				topmostPost = await this.data.posts.getById(topmostPost.parentPostId);
			}
		}
		const grokPrompt = topmostPost.grokConversation;

		if(grokPrompt){
			await this.continueConversation(grokPrompt, grokUserId, topmostPost);
		}
		else {
			await this.startNewConversation(grokUserId, topmostPost);
		}
	}

	async continueConversation(grokPrompt, grokUserId, topmostPost){
		const conversation = [grokPrompt];
		
		const parentPostIds = [this.request.body.parentPostId];
		if(this.request.body.parentPostId !== topmostPost.id){
			parentPostIds.push(topmostPost.id);
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
		let codeError;

		if(topmostPost.codeErrorId){
			codeError = await this.data.codeErrors.getById(topmostPost.codeErrorId);
		}
		else {
			codeError = await this.data.codeErrors.getByQuery({
				objectId: topmostPost.id,
				objectType: 'post'
			},{
				hint: CodeErrorIndexes.byObjectId
			});
		}

		// get the last stack trace we have - text is full stack trace
		const stackTrace = codeError.stackTraces.slice(-1).pop().text ?? "stack trace";
		const code = this.request.body.codeBlock ?? "code";

		const conversation = [{
			role: "system",
			content: "As a coding expert I am helpful and very knowledgeable about how to fix errors in code. I will be given errors, stack traces, and code snippets to analyze and fix. I will output brief descriptions and the fixed code blocks."
		},
		{
			role: "user", 
			content: `Analyze this stack trace:\n``${ stackTrace }``\nAnd fix the following code:\n``${ code }``\n`
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
			id: topmostPost.Id
		}).save({
			$set: {
				grokConversation: conversation
			}
		});
		
		// store Grok response as new Post 
		const post = await this.creator.createModel({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.team.id,
			text: response.content,
			promptRole: response.role,
			parentPostId: topmostPost.Id,
			codeError: codeError.id,
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
		const channel = `team-${this.team.id}`;

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
			teamIds: [this.team.id],
			companyIds: [this.team.companyId],
			userBeingAddedToTeamId: this.team.id,
			dontSetInviteType: true,
			dontSetInviteCode: true,
			ignoreUsernameOnConflict: true
		})
		
		let grokUser = await userCreator.createUser({
			username: "Grok"
		});

		console.log(`GROK CREATED - ${grokUser.id}`)

		//grokUser = this.data.users.getById(grokUser.id);

		console.log(`ADDING GROK TO TEAM: ${this.team.id}`)

		await new AddTeamMembers({
			request: this,
			addUsers: [grokUser],
			team: this.team
		}).addTeamMembers();

		await new ModelSaver({
			request: this,
			collection: this.data.teams,
			id: this.team.id
		}).save({
			$set: {
				grokUserId: grokUser.id
			}
		});

		console.log("BROADCASTING");

		await this.broadcast({
			users: [grokUser]
		});

		console.log("RETURNING GROK");

		return grokUser;
	}

	async submitConversationToGrok(conversation, temperature = 0){
		const request = {
			messages: conversation,
			temperature: temperature
		};

		const response = await fetch(this.request.api.config.newrelicgrok.apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"api-key": `${this.request.api.config.newrelicgrok.apiKey}`,
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

