// fulfill an inbound-email request, called by the inbound email server to
// ingest an inbound email and turn it into a post for the stream

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const PostCreator = require(process.env.CS_API_TOP + '/modules/posts/post_creator');
const Errors = require('./errors');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

class InboundEmailRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	// authorize the client (the inbound email server) to make this request
	async authorize () {
		// we rely on a secret, known only to the inbound email server and the
		// API server ... disallowing arbitrary clients to call this request
		if (this.request.body.secret !== this.api.config.secrets.mail) {
			throw this.errorHandler.error('unauthorized');
		}
	}

	// process the request...
	async process () {
		await this.requireAllow();
		await this.getCreator();
		await this.parseToAddresses();
		await this.getStream();
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
					databaseOptions: {
						hint: UserIndexes.bySearchableEmail
					}
				}
			);
		}
		catch (error) {
			throw this.errorHandler.error('internal', { reason: error });
		}
		if (users.length === 0) {
			throw this.errorHandler.error('creatorNotFound', { info: this.fromEmail });
		}
		this.fromUser = users[0];
	}

	// get the stream ID represented by one of the email addresses in the to-field
	async parseToAddresses () {
		this.streamId = null;
		let i = 0;
		// stop when we find the first valid stream ID
		while (!this.streamId && i < this.request.body.to.length) {
			await this.parseToAddress(this.request.body.to[i++]);
		}
	}

	// parse a single email object in the to-field, looking for a valid stream ID
	async parseToAddress (toObject) {
		const email = toObject.address.toLowerCase();

		// make sure it has our reply-to domain, otherwise we are just plain
		// not interested!
		const regexp = new RegExp(this.api.config.email.replyToDomain + '$', 'i');
		if (!regexp.test(email)) {
			return this.log(`Email ${email} does not match the reply-to domain`);
		}

		// extract the first part of the email, this should be our stream ID
		const addressParts = email.trim().split('@');
		if (addressParts.length !== 2) {
			return this.log(`Email ${email} is not a valid email`);
		}

		// split the first part by '.', this separates the team ID and the stream ID
		const idParts = addressParts[0].split('.');
		if (idParts.length !== 2) {
			return this.log(`Email ${email} does not conform to the correct format for ingestion`);
		}

		// check that the IDs are valid
		if (!this.data.streams.objectIdSafe(idParts[0])) {
			return this.log(`Email ${email} does not reference a valid stream ID`);
		}
		if (!this.data.teams.objectIdSafe(idParts[1])) {
			return this.log(`Email ${email} does not reference a valid team ID`);
		}

		// good to go
		this.streamId = idParts[0];
		this.teamId = idParts[1];
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
			forInboundEmail: true
		});
		try {
			await this.postCreator.createPost({
				streamId: this.streamId,
				text: this.request.body.text,
				origin: 'email'
			});
		}
		catch (error) {
			throw this.errorHandler.error('internal', { reason: error });
		}
		this.post = this.postCreator.model;
		this.responseData.post = this.post.getSanitizedObject();
	}

	// after the post is created...
	async postProcess () {
		await this.postCreator.postCreate();
	}
}

module.exports = InboundEmailRequest;
