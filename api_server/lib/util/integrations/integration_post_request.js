// fulfill an integration post request, called by the integration bot to
// ingest an integration post and turn it into a post for the stream

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const PostCreator = require(process.env.CS_API_TOP + '/modules/posts/post_creator');
const UserCreator = require(process.env.CS_API_TOP + '/modules/users/user_creator');
const AddTeamMembers = require(process.env.CS_API_TOP + '/modules/teams/add_team_members');
const Errors = require('./errors');

class IntegrationPostRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		if (!this.module.integrationConfig) {
			throw 'integration module must have an integration config';
		}
		Object.assign(this, this.module.integrationConfig);
		['integrationName', 'secret', 'botOrigin', 'botReceivePath'].forEach(configOption => {
			if (!this[configOption]) {
				throw `must provide ${configOption} to the integration-enable request`;
			}
		});
	}

	// authorize the client (the integration bot) to make this request
	async authorize () {
		// we rely on a secret, known only to the integration bot and the
		// API server ... disallowing arbitrary clients to call this request
		if (this.request.body.secret !== this.secret) {
			throw this.errorHandler.error('unauthorized');
		}
	}

	// process the request...
	async process() {
		this.log(`Processing an inbound ${this.integrationName} post from ${this.request.body.authorEmail}`);
		await this.requireAllow();
		await this.getTeam();
		await this.getRepo();
		await this.getStream();
		await this.getParentPost();
		await this.getOrCreateAuthor();
		await this.addToTeam();
		await this.createPost();
	}

	// these parameters are required and/or optional for the request
	async requireAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'streamId', 'authorEmail', 'authorUsername', 'parentPostId', 'text', 'secret'],
				},
				optional: {
					'array(string)': ['mentionedUsers'],
					string: ['repoId']
				}
			}
		);
	}

	// get the team
	async getTeam () {
		this.team = await this.data.teams.getById(
			this.request.body.teamId.toLowerCase()
		);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// get the repo
	async getRepo () {
		if (!this.request.body.repoId) {
			return;
		}
		this.repo = await this.data.repos.getById(
			this.request.body.repoId.toLowerCase()
		);
		if (!this.repo) {
			throw this.errorHandler.error('notFound', { info: 'repo' });
		}
		if (this.repo.get('teamId') !== this.team.id) {
			throw this.errorHandler.error('repoNoMatchTeam');
		}
	}

	// get the stream
	async getStream () {
		this.stream = await this.data.streams.getById(
			this.request.body.streamId.toLowerCase()
		);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
		if (
			this.stream.get('type') === 'file' && 
			this.stream.get('repoId') !== this.repo.id
		) {
			throw this.errorHandler.error('streamNoMatchRepo');
		}
		else if (
			this.stream.get('type') !== 'file' &&
			this.stream.get('teamId') !== this.team.id
		) {
			throw this.errorHandler.error('streamNoMatchTeam');
		}
	}

	// get the parent post
	async getParentPost () {
		this.parentPost = await this.data.posts.getById(
			this.request.body.parentPostId.toLowerCase()
		);
		if (!this.parentPost) {
			throw this.errorHandler.error('notFound', { info: 'parent post' });
		}
		if (this.parentPost.get('streamId') !== this.stream.id) {
			throw this.errorHandler.error('parentPostNoMatchStream');
		}
	}

	// if we can't find the author (by matching email), we'll create one as part of the team
	async getOrCreateAuthor () {
		const user = {
			email: this.request.body.authorEmail,
			username: this.request.body.authorUsername,
		};
		this.userCreator = new UserCreator({
			request: this,
			dontSaveIfExists: true,
			ignoreUsernameOnConflict: true,	// if there is a username conflict, just ignore the username coming from the bot
			teamIds: [this.team.id]			// user will be added directly to the team if it is a new user
		});
		this.author = await this.userCreator.createUser(user);
	}

	// if we couldn't find a matching author, we created one, and now we need to
	// add them to the team
	async addToTeam () {
		// check if a user we found is a member of the team already, if not, add them
		if (
			!this.userCreator.existingModel ||
			this.userCreator.existingModel.hasTeam(this.team.id)
		) {
			return;
		}
		// add the author of the post to the team, this will only fail if there is
		// a username conflict with an existing user on the team ... still not sure
		// what to do about that case
		const adder = new AddTeamMembers({
			request: this,
			users: [this.author],
			teamId: this.team.id
		});
		this.addedToTeam = true;
		await adder.addTeamMembers();
	}

	// create a post for this integration post in our stream
	async createPost () {
		this.user = this.author;
		this.postCreator = new PostCreator({
			request: this,
			forIntegration: this.integrationName
		});
		await this.postCreator.createPost({
			streamId: this.stream.id,
			text: this.request.body.text,
			parentPostId: this.parentPost.id,
			origin: this.integrationName
		});
		this.post = this.postCreator.model;
		this.responseData.post = this.post.getSanitizedObject();
		if (!this.userCreator.existingModel || this.addedToTeam) {
			this.responseData.users = [this.userCreator.model.getSanitizedObject()];
		}
		this.responseData.parentPost = this.parentPost.getSanitizedObject();
		if (this.repo) {
			this.responseData.repo = this.repo.getSanitizedObject();
		}
		this.responseData.stream = this.stream.getSanitizedObject();
	}

	// after the post is created...
	async postProcess () {
		delete this.responseData.stream; // avoid interpreting this as a new stream, kind of hacky
		await this.postCreator.postCreate();
	}
}

module.exports = IntegrationPostRequest;
