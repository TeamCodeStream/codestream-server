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

		if(!!this.request.body.analyze ||  this.request.body){
			await this.analyzeErrorWithGrok();
		}
	}

	async analyzeErrorWithGrok() {
		// add settings / secrets
		const apiUrl =
			"https://nr-generativeai-api.openai.azure.com/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-03-15-preview";
		const apiKey = "";

		if (!apiKey) {
			throw new ResponseError(ERROR_CHATGPT_INVALID_RESPONSE, JSON.stringify(apiResponse));
		}

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

		// do we have a pre-existing converation?
			// find if we have any Grok posts tied to this codeErrorId
			
			// true: 
				// pull all previous messages ordered by created
				// take on this new posts text
					// we should only get here if they mentioned Grok to begin with
			// false: 
				// prime the pump with the starting prompts
				// there won't be a message included that we need to worry about

		// find Grok User
		// Create Grok pseudo-user in team / org
		
		const systemPrompt = {
			role: "system",
			prompt: "As a coding expert I am helpful and very knowledgeable about how to fix errors in code. I will be given errors, stack traces, and code snippets to analyze and fix. I will output brief descriptions and the fixed code blocks."
		};

		// store identity request
		this.creator.createPost({
			hidden: true,
			promptRole: systemPrompt.role,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: systemPrompt.prompt,
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
			creatorId: grokUser.id
		});


		// conversation cache = hidden posts by Grok for this codeErrorId
		// order by creation date?


	
		const request = {
			messages: conversation,
			temperature: 0,
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

		if (isChatGptErrorResponse(apiResponse)) {
			throw new ResponseError(ERROR_CHATGPT_INVALID_RESPONSE, JSON.stringify(apiResponse));
		}
	
		if (isEmpty(apiResponse.choices)) {
			throw new ResponseError(ERROR_CHATGPT_INVALID_RESPONSE, JSON.stringify(apiResponse));
		}
	
		const message = apiResponse.choices[0].message;
		if (!message) {
			throw new ResponseError(ERROR_CHATGPT_INVALID_RESPONSE, JSON.stringify(apiResponse));
		}

		// store identity response
		this.creator.createPost({
			hidden: true,
			promptRole: message.role,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: message.content,
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
			creatorId: 42 //Who should this be? Grok?
		});

		const stackTrace = 'STACK';
		const analyzePrompt = `Analze this thing, minion.\n\n
		Here is the codeblock associated with the error: ${this.request.body.codeblock}\n\n
		Here is the stacktrace for the error: ${stackTrace}`;

		// store analyze request
		this.creator.createPost({
			hidden: true,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: analyzePrompt,
			promptRole: "user",
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
			creatorId: 42 //Who should this be? Grok?
		});

		// call Azure AI to analyze
		const azureAnalyzeResponse = {};

		// store analyze response AS PUBLIC
		this.creator.createPost({
			hidden: false,
			streamId: this.request.body.streamId,
			teamId: this.request.body.teamId,
			text: azureAnalyzeResponse,
			parentPostId: this.request.body.parentPostId,
			codeError: this.request.body.codeError,
			creatorId: 42 //Who should this be? Grok?
		});

		// PubNub the public response back to clients
			// Maybe this would happen via postProcess()?
			// or we need to PostProcess the new PUBLIC GROK response/post?
			// or if we inception the post create API, automagic.

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
