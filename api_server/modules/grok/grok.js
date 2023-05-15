'use strict';

const fetch = require('node-fetch');
const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const Errors = require('./errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');

class Grok extends APIServerModule {

	constructor(config) {
		super(config);
		this.errorHandler = new ErrorHandler(Errors);
	}

	async analyzeErrorWithGrok() {
		const grokUserId = this.team.grokUserId;

		//if team already has a grokUserId, then this has to be an existing conversation
		if(grokUserId) {
			await this.continueConversation(existingConversation, grokUserId);
		}
		else{
			let grokUser = await this.createGrokUser();

			await this.startNewConversation(grokUser.id);
		}
	}

	async continueConversation(grokUser){
		const conversation = [];
		
		// TODO: Get the previous conversation
		//   1. From parentPostId where text is empty
		//			post.grokConversation
		//
		//   2. All other posts which have forGrok = true

		const message = {
			role: "user",
			content: this.request.body.text
		}

		// TODO - update the users original Post to include `forGrok: true`

		conversation.push(message)

		const response = this.submitConversationToGrok(conversation);
		
		const post = await new ModelCreator({
			request: this.request,
			collectionName: "posts"
		}).createModel({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: response.content,
			promptRole: response.role,
			parentPostId: this.request.body.parentPostId,
			codeError: this.attributes.codeErrorId,
			creatorId: grokUser.id
		});

		this.broadcast({
			posts: [post]
		});
	}

	async startNewConversation(grokUser) {
		const codeError = this.data.codeErrors.getById(this.attributes.codeErrorId);

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
			id: this.request.body.parentPostId
		}).save({
			$set: {
				grokConversation: conversation
			}
		});
		
		// store Grok response as new Post 
		const post = await new ModelCreator({
			request: this.request,
			collectionName: "posts"
		}).createModel({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: response.content,
			promptRole: response.role,
			parentPostId: this.request.body.parentPostId,
			codeError: this.attributes.codeErrorId,
			creatorId: grokUser.id
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

