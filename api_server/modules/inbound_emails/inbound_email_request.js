// fulfill an inbound-email request, called by the inbound email server to
// ingest an inbound email and turn it into a post for the stream

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const Errors = require('./errors');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

class InboundEmailRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	// authorize the client (the inbound email server) to make this request
	async authorize () {
		// if no reply-to domain is specified, this is probably an on-prem installation
		// where inbound emails are not supported
		if (this.api.config.inboundEmailServer.inboundEmailDisabled) {
			throw this.errorHandler.error('notSupported');
		}

		// we rely on a secret, known only to the inbound email server and the
		// API server ... disallowing arbitrary clients to call this request
		if (this.request.body.secret !== this.api.config.sharedSecrets.mail) {
			throw this.errorHandler.error('unauthorized');
		}
	}

	// process the request...
	async process () {
		await this.requireAllow();
		await this.parseToAddresses();
		await this.getCreator();
		await this.getStream();
		await this.getParentPost();
		await this.validate();
		await this.handleAttachments();
		await this.getTeam();
		await this.createPost();
	}

	// these parameters are required and/or optional for the request
	async requireAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					object: ['from'],
					string: ['text', 'mailFile', 'secret'],
					'array(object)': ['to']
				},
				optional: {
					'array(object)': ['attachments']
				}
			}
		);
	}

	// get the person from whom the email originated, if we can find them...
	async getCreator () {
		let from = this.request.body.from;
		if (!from.address) {
			throw this.errorHandler.error('noFromAddress', { info: this.fromEmail });
		}
		this.fromEmail = from.address.toLowerCase();
		this.log(`Processing an inbound email (${this.request.body.mailFile}) from ${this.fromEmail}`);
		let users;
		try {
			users = await this.data.users.getByQuery(
				{
					searchableEmail: this.fromEmail
				},
				{
					hint: UserIndexes.bySearchableEmail
				}
			);
		}
		catch (error) {
			throw this.errorHandler.error('internal', { reason: error });
		}
		if (users.length === 0) {
			throw this.errorHandler.error('creatorNotFound', { info: this.fromEmail });
		}
	
		// find the user record for the user on this team
		if (!this.fromUser) {
			this.log(`No user record found matching email ${this.fromEmail} on team ${this.teamId}`);
			throw this.errorHandler.error('unauthorized');
		}
	}

	// get the stream ID represented by one of the email addresses in the to-field
	async parseToAddresses () {
		this.streamId = null;
		let i = 0;
		// stop when we find the first valid stream ID
		while (!this.streamId && i < this.request.body.to.length) {
			await this.parseToAddress(this.request.body.to[i++]);
		}

		if (!this.streamId) {
			throw this.errorHandler.error('noMatchFound', { info: this.request.body.to });
		}
	}

	// parse a single email object in the to-field, looking for a valid stream ID
	async parseToAddress (toObject) {
		const email = toObject.address.toLowerCase();

		// make sure it has our reply-to domain, otherwise we are just plain
		// not interested!
		const regexp = new RegExp(this.api.config.email.replyToDomain + '$', 'i');
		if (!regexp.test(email)) {
			return this.log(`Email ${email} does not match the reply-to domain of ${this.api.config.email.replyToDomain}`);
		}

		// extract the first part of the email, this should be our stream ID
		const addressParts = email.trim().split('@');
		if (addressParts.length !== 2) {
			return this.log(`Email ${email} is not a valid email`);
		}

		// split the first part by '.', this separates the team ID and the stream ID
		const idParts = addressParts[0].split('.').reverse();
		if (idParts.length < 2 || idParts.length > 3) {
			return this.log(`Email ${email} does not conform to the correct format for ingestion`);
		}

		// check that the IDs are valid
		if (!this.data.streams.objectIdSafe(idParts[0])) {
			return this.log(`Email ${email} does not reference a valid team ID`);
		}
		if (!this.data.teams.objectIdSafe(idParts[1])) {
			return this.log(`Email ${email} does not reference a valid stream ID`);
		}
		if (idParts[2] && !this.data.teams.objectIdSafe(idParts[2])) {
			return this.log(`Email ${email} does not reference a valid parent post ID`);
		}

		// good to go
		this.teamId = idParts[0];
		this.streamId = idParts[1];
		this.parentPostId = idParts[2];
	}

	// get the stream associated with the IDs we found
	async getStream () {
		if (!this.streamId) {
			throw this.errorHandler.error('noMatchFound', { info: this.request.body.to });
		}
		try {
			this.stream = await this.data.streams.getById(this.streamId);
		}
		catch (error) {
			throw this.errorHandler.error('internal', { reason: error });
		}
		if (!this.stream) {
			throw this.errorHandler.error('streamNotFound', { info: this.streamId });
		}
	}

	// get the parent post associated with the original email notification
	async getParentPost () {
		if (!this.parentPostId) {
			return;
		}
		try {
			this.parentPost = await this.data.posts.getById(this.parentPostId);
		}
		catch (error) {
			throw this.errorHandler.error('internal', { reason: error });
		}
		if (!this.parentPost) {
			throw this.errorHandler.error('parentPostNotFound', { info: this.parentPostId });
		}
	}

	// validate the stream: the stream must be owned by the correct team, and the
	// user originating the email must be on the team
	async validate () {
		if (this.stream.get('teamId') !== this.teamId) {
			throw this.errorHandler.error('streamNoMatchTeam', { info: this.streamId });
		}
		if (!this.fromUser.hasTeam(this.teamId)) {
			this.log(`User ${this.fromUser.id} is not on team ${this.teamId}`);
			throw this.errorHandler.error('unauthorized');
		}
		if (this.parentPost && this.parentPost.get('teamId') !== this.teamId) {
			throw this.errorHandler.error('parentPostNoMatchTeam', { info: this.parentPostId });
		}
		if (this.parentPost && this.parentPost.get('streamId') !== this.streamId) {
			throw this.errorHandler.error('parentPostNoMatchStream', { info: this.parentPostId });
		}
	}

	// handle any attachments in the email
	async handleAttachments () {
		// not yet supported
	}

	// get the team, unfortunately we need this for tracking
	async getTeam () {
		this.team = await this.data.teams.getById(this.stream.get('teamId'));
	}

	// create a post for this email in the stream
	async createPost () {
		this.user = this.fromUser;
		this.postCreator = new PostCreator({
			request: this,
			team: this.team,
			forInboundEmail: true,
			origin: 'email'
		});
		const postData = {
			teamId: this.team.id,
			streamId: this.streamId,
			text: this.request.body.text
		};
		if (this.parentPostId) {
			postData.parentPostId = this.parentPostId;
		}
		try {
			await this.postCreator.createPost(postData);
		}
		catch (error) {
			throw this.errorHandler.error('internal', { reason: error });
		}
		this.post = this.postCreator.model;
		this.responseData.post = this.post.getSanitizedObject({ request: this });
		this.responseData = this.postCreator.makeResponseData({
			transforms: this.transforms,
			initialResponseData: this.responseData
		});
	}

	// after the post is created...
	async postProcess () {
		await this.postCreator.postCreate();
	}
}

module.exports = InboundEmailRequest;
