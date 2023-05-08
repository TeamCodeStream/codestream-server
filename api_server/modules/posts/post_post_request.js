// handle the POST /posts request to create a new post

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');
const fetch = require('node-fetch');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');

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

	async submitApiCall(request){
		const apiUrl =
			"https://nr-generativeai-api.openai.azure.com/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-03-15-preview";
		const apiKey = ""; // TODO

		if (!apiKey) {
			throw this.errorHandler.error('aiError', { reason: 'ChatGPT: API Key' });
		}

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
		// see if we have a Grok user for this team / company
		const grokUser = await this.data.users.getByQuery(
			{
				$and: [
					{ companyIds: { $elemMatch: { $eq: `${this.company.id}` } } },
					{ teamIds: { $elemMatch: { $eq: `${this.user.teamId}` } } },
					{ username: "Grok" }
				]
			},
			{
				fields: ['_id'],
				noCache: true
			}
		);

		const doesGrokUserExist = !!grokUser;

		if(!doesGrokUserExist) {
			grokUser = this.UserCreator.createUser({
				teamIds: [this.user.teamId],
				companyIds: [this.company.id],
				username: "Grok",
				preferences: {
					"emailNotifications": "off"
				},
				isRegistered: true,
				hasReceivedFirstMail: true
			})
		}

		// post.codeErrorId
		// creatorId: grok.Id
		// text: $ne
		// order by createdAt
		const existingConversation = await this.data.posts.getByQuery(
			{
				$and: [
					{ codeErrorId: this.request.body.codeError.id },
					{ creatorId: grokUser.id },
					{ text: $ne },
				]
			},
			{
				fields: ['promptRole', 'text'],
				sort: {
					createdAt: 1
				},
				noCache: true
			}
		);

		if(existingConversation && existingConversation.length > 0){
			await this.continueConversation(existingConversation, grokUser);
		}
		else {
			await this.startNewConversation(grokUser);
		}
	}

	async startNewConversation(grokUser) {
		const conversation = [];

		const systemPrompt = {
			role: "system",
			content: "As a coding expert I am helpful and very knowledgeable about how to fix errors in code. I will be given errors, stack traces, and code snippets to analyze and fix. I will output brief descriptions and the fixed code blocks."
		};

		// store identity request
		this.creator.createPost({
			hidden: true,
			promptRole: systemPrompt.role,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: systemPrompt.content,
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
			creatorId: grokUser.id
		});

		conversation.push(systemPrompt);

		var response = await submitApiCall({
			messages: conversation,
			temperature: 0,
		});

		// store identity response
		this.creator.createPost({
			hidden: true,
			promptRole: response.role,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: response.content,
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
			creatorId:  grokUser.id
		});

		// TODO: Finalize this prompt
		const analyzePrompt = {
			role: "user", 
			content: `Analze this thing, minion.\n\n
		Here is the codeblock associated with the error: ${this.request.body.codeblock}\n\n
		Here is the stacktrace for the error: STACKTRACE`
		};

		// store analyze request
		this.creator.createPost({
			hidden: true,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: analyzePrompt.content,
			promptRole: analyzePrompt.role,
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
			creatorId: grokUser.id
		});

		conversation.push(analyzePrompt);

		response = await submitApiCall({
			messages: conversation,
			temperature: 0,
		});
		
		// store analyze response AS PUBLIC
		this.creator.createPost({
			hidden: false,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: response.content,
			promptRole: response.role,
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
			creatorId: grokUser.id
		});

		// TODO PubNub the public response back to clients
	}

	async continueConversation(existingConversation, grokUser){
		const message = {
			role: "user",
			content: this.request.body.text
		}

		// store identity request
		this.creator.createPost({
			hidden: true,
			promptRole: message.role,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: message.content,
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
			creatorId: grokUser.id
		});

		existingConversation.push(message)

		const response = this.submitApiCall({
			messages: existingConversation,
			temperature: 0,
		});
		
		// store response AS PUBLIC
		this.creator.createPost({
			hidden: false,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: response.content,
			promptRole: response.role,
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
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
