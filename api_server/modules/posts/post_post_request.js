// handle the POST /posts request to create a new post

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');
const fetch = require('node-fetch');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');

class PostPostRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		const streamId = this.request.body.streamId;
		if (!streamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
		const stream = await this.user.authorizeStream(streamId.toLowerCase(), this);
		if (!stream) {
			throw this.errorHandler.error('createAuth');
		}
		if (!stream.get('isTeamStream') && stream.get('type') !== 'object') {
			throw this.errorHandler.error('deprecated', { reason: 'posts can only be created in the team stream or an object stream' });
		}
		if (this.request.body.teamId && this.request.body.teamId !== stream.get('teamId')) {
			throw this.errorHandler.error('invalidParameter', { reason: 'teamId does not match the stream' });
		}
		this.request.body.teamId = stream.get('teamId');
	}

	/* eslint complexity: 0 */
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		this.responseData = this.creator.makeResponseData({
			transforms: this.transforms,
			initialResponseData: this.responseData
		});

		await super.handleResponse();
	}

	async postProcess () {
		await super.postProcess();

		if(!!this.request.body.analyze || this.request.body.text.match(/\@Grok/gmi)){
			await this.analyzeErrorWithGrok();
		}
	}

	async submitConversationToGrok(conversation, temperature = 0){
		// TODO: Split this out to its own module or something

		const apiUrl =
			"https://nr-generativeai-api.openai.azure.com/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-03-15-preview";
		const apiKey = ""; // TODO

		if (!apiKey) {
			throw this.errorHandler.error('aiError', { reason: 'ChatGPT: API Key' });
		}

		const request = {
			messages: conversation,
			temperature: temperature
		};

		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"api-key": `${apiKey}`,
			},
			body: JSON.stringify(request),
		});
	
		const apiResponse = await response.json();

		if (apiResponse && apiResponse.error) {
			throw this.errorHandler.error('aiError', { reason: `ChatGPT API Error: ${JSON.stringify(apiResponse)}` });
		}
	
		if (apiResponse && apiResponse.choices && apiResponse.choices.length === 0) {
			throw this.errorHandler.error('aiError', { reason: `ChatGPT Response Empty: ${JSON.stringify(apiResponse)}` });
		}
	
		const message = apiResponse.choices[0].message;
		if (!message) {
			throw this.errorHandler.error('aiError', { reason: `ChatGPT Response; No Message: ${JSON.stringify(apiResponse)}` });
		}

		return message;
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

	async createGrokUser() {
		const userCreator = new UserCreator({
			request: this.request,
			team: this.team
		});

		let grokUser = await userCreator.createUser({
			username: "Grok"
		});

		await new AddTeamMembers({
			request: this,
			addUsers: [grokUser],
			team: team
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
		
		const message = {
			users: [grokUser]
		};
		try {
			await this.request.api.services.broadcaster.publish(
				message,
				'team-' + this.team.id,
				{ request: this.request }
			);
		}
		catch (error) {
			this.request.warn(`Could not publish user message to team ${this.team.id}: ${JSON.stringify(error)}`);
		}

		return grokUser;
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
		const post = this.creator.createPost({
			forGrok: true,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: response.content,
			promptRole: response.role,
			parentPostId: this.request.body.parentPostId,
			codeError: this.attributes.codeErrorId,
			creatorId: grokUser.id
		});

		const message = {
			posts: [post]
		};

		try {
			await this.request.api.services.broadcaster.publish(
				message,
				'team-' + this.team.id,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish post message to channel ${channel}: ${JSON.stringify(error)}`);
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

		// store identity request
		// note: even though the post has already been stored, its been stored
		// as the user who posted it. To make life a bit easier downstream
		// adding it AGAIN, but as a hidden Grok post.
		this.creator.createPost({
			hidden: true,
			promptRole: message.role,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: message.content,
			parentPostId: this.request.body.parentPostId,
			codeError: this.attributes.codeErrorId,
			creatorId: grokUser.id
		});

		conversation.push(message)

		const response = this.submitConversationToGrok(conversation);
		
		// store response AS PUBLIC
		this.creator.createPost({
			hidden: false,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: response.content,
			promptRole: response.role,
			parentPostId: this.request.body.parentPostId,
			codeError: this.attributes.codeErrorId,
			creatorId: grokUser.id
		});

		// TODO pubnub the response back to the clients
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a post, along with associated codemark and markers. File streams and repos can also be created on-the-fly for the markers.';
		description.access = 'The current user must be a member of the stream.';
		description.input = {
			summary: description.input,
			looksLike: {
				'streamId*': '<ID of the stream in which the post is being created, required unless a stream object is specified>',
				'text': '<Text of the post>',
				'parentPostId': '<For replies, the ID of the parent post>',
				'codemark': '<Single @@#codemark#codemark@@ object, for creating a codemark referenced by the post>',
				'review': '<Single @@review@review@@ object, for creating a code review referenced by the post>',
				'codeError': '<Single @@code error@codeError@@ object, for creating a code error referenced by the post>',
				'mentionedUserIds': '<Array of IDs representing users mentioned in the post>',
				'reviewCheckpoint': '<Checkpoint number of the review this post is associated with>',
				'addedUsers': '<Array of emails representing non-team users being implicitly invited and mentioned>'
			}
		};
		description.returns.summary = 'A post object, plus additional objects that may have been created on-the-fly, marker objects and marker locations for any markers';
		Object.assign(description.returns.looksLike, {
			codemark: [
				'<@@#codemark object#codemark@@ > (knowledge base codemark referenced by this post)>',
				'...'
			],
			markers: [
				'<@@#marker objects#marker@@ > (marker objects associated with quoted markers)',
				'...'
			],
			markerLocations: '<@@#marker locations object#markerLocations@@ > (marker locations for markers associated with quoted markers)',
			streams: [
				'<@@#stream object#stream@@ > (additional streams created on-the-fly for markers)>',
				'...'
			],
			repos: [
				'<@@#repo object#repo@@ > (additional repos created on-the-fly for markers)>',
				'...'
			]
		});
		description.publishes = {
			summary: 'If the post was created in a team stream (a channel with all members of the team), then the post object will be published to the team channel; otherwise it will be published to the stream channel for the stream in which it was created.',
			looksLike: '(same as response)'
		};
		description.errors.push('noReplyToReply');
		description.errors.push('noReplyWithReview');
		description.errors.push('noCodemarkAndReview');
		description.errors.push('noReplyWithCodeError');
		description.errors.push('noCodemarkAndCodeError');
		return description;
	}
}

module.exports = PostPostRequest;
