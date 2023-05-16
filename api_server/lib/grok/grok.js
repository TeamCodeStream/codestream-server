'use strict';

const fetch = require('node-fetch');
const Errors = require('./errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');

class Grok {

	constructor(config) {
		Object.assign(this, config);

		this.request.errorHandler.add(Errors);
	}

	async analyzeErrorWithGrok() {
		let grokUserId = this.team.grokUserId;

		if(!grokUserId) {
			grokUserId = await this.createGrokUser().id;
		}

		let topmostPost = this.data.posts.getById(this.request.body.parentPostId);

		if(topmostPost.parentPostId !== this.request.body.parentPostId){
			topmostPost = this.data.posts.getById(topmostPost.parentPostId);
		}

		const grokPrompt = topmostPost.grokConversation;

		if(grokPrompt){
			await this.continueConversation(grokPrompt, grokUserId, topmostPost.id);
		}
		else {
			await this.startNewConversation(grokUserId, topmostPost.id);
		}
	}

	async continueConversation(grokPrompt, grokUserId, topmostPostId){
		const conversation = [grokPrompt];
		
		const parentPostIds = [this.request.body.parentPostId];
		if(this.request.body.parentPostId !== topmostPostId){
			parentPostIds.push(topmostPostId);
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

		const response = this.submitConversationToGrok(conversation);
		
		const post = await this.postCreator.createModel({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: response.content,
			promptRole: response.role,
			parentPostId: topmostPostId,
			codeError: this.response.initialResponseData.codeError.id,
			creatorId: grokUserId
		});

		this.broadcast({
			posts: [post]
		});
	}

	async startNewConversation(grokUserId, topmostPostId) {
		// if this is truly a new conversation, then a Post and CodeError must have been created, right?
		const codeError = this.response.initialResponseData.codeError;

		// get the last stack trace we have - text is full stack trace
		const stackTrace = codeError.stackTraces.slice(-1).pop().text;
		const code = this.request.body.codeBlock;

		const conversation = [{
			role: "system",
			content: "As a coding expert I am helpful and very knowledgeable about how to fix errors in code. I will be given errors, stack traces, and code snippets to analyze and fix. I will output brief descriptions and the fixed code blocks."
		},
		{
			role: "user", 
			content: `Analyze this stack trace:\n````${ stackTrace }````\nAnd fix the following code:\n````${ code }````\n`
		}];

		var response = await submitConversationToGrok(conversation);

		conversation.push({
			role: response.role,
			content: response.content
		});

		// Update initial post with the current conversation.
		await new ModelSaver({
			request: this.request,
			collection: this.data.posts,
			id: topmostPostId
		}).save({
			$set: {
				grokConversation: conversation
			}
		});
		
		// store Grok response as new Post 
		const post = await this.postCreator.createModel({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: response.content,
			promptRole: response.role,
			parentPostId: topmostPostId,
			codeError: codeError.id,
			creatorId: grokUserId
		});

		this.broadcast({
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
		const grokUser = await new ModelCreator({
			request: this.request,
			collectionName: "users"
		}).createModel({
			username: "Grok"
		});

		await new AddTeamMembers({
			request: this.request,
			addUsers: [grokUser],
			team: this.team
		}).addTeamMembers();

		await new ModelSaver({
			request: this.request,
			collection: this.data.teams,
			id: this.team.id
		}).save({
			$set: {
				grokUserId: grokUser.id
			}
		});
		
		this.broadcast({
			users: [grokUser]
		});

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

module.exports = Grok;

