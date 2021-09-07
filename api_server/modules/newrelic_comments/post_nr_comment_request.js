// fulfill a request to create a New Relic comment

'use strict';

const NRCommentRequest = require('./nr_comment_request');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const CodeErrorIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/indexes');
const TeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_creator');
const Utils = require('./utils');

class PostNRCommentRequest extends NRCommentRequest {

	// process the request...
	async process () {
		this.users = [];

		// handle which attributes are required and allowed for the request
		await this.requireAllow();

		// get the existing observablity object for this comment, if any
		const { objectId, objectType } = this.request.body;
		this.ocodeError = await this.data.codeErrors.getOneByQuery(
			{ objectId, objectType },
			{ hint: CodeErrorIndexes.byObjectId }
		);

		// resolve the requesting user, and what team they belong to, 
		// which may involve both creating a (faux) user, and creating a (faux?) team
		await this.resolveUserAndTeam();

		// create a code error linked to the New Relic object to which the comment is attached
		// for now, this is a "code error" object only
		if (!this.codeError) {
			await this.createCodeError();
		}

		// handle any mentions in the post
		await this.handleMentions(this.request.body.mentionedUsers);

		// now create the actual post attached to the object
		await this.createPost();
	}

	// handle which attributes are required and allowed for this request
	async requireAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					object: ['creator'],
					number: ['accountId'],
					string: ['objectId', 'objectType'],
				},
				optional: {
					string: ['parentPostId', 'text'],
					'array(object)': ['mentionedUsers']
				}
			}
		);

		if (!Utils.CodeErrorObjectTypes.includes(this.request.body.objectType)) {
			throw this.errorHandler.error('validation', { info: 'objectType is not an accepted code error type' });
		}
	}


	// resolve the requesting user, and what team they belong to, 
	// which may involve both creating a (faux) user, and creating a (faux?) team
	async resolveUserAndTeam () {
		// if we have a code error, get the team that owns it
		if (this.codeError) {
			this.team = await this.data.teams.getById(this.codeError.get('teamId'));
			if (!this.team || this.team.get('deactivated')) {
				throw this.errorHandler.error('notFound', { info: 'team' }); // shouldn't really happen
			}
		}

		// find or create a "faux" user, as needed
		this.user = this.request.user = await this.findOrCreateUser(this.request.body.creator);
		this.users.push(this.user);

		// if we don't have an existing code error already, then we don't know
		// what team to put the user on ... so if the user isn't on a team, we create one
		if (!this.team) {
			const teamId = (this.user.get('teamIds') || [])[0];
			if (teamId) {
				// FIXME, TODO: deal with the accountId here, which we can use to match to 
				// a user's company (therefore team) ... this is dependent on company-centric work
				// (which isn't done yet)
				this.team = await this.data.teams.getById(teamId);
				if (!this.team || this.team.get('deactivated')) {
					throw this.errorHandler.error('notFound', { info: 'team' }); // shouldn't really happen
				}
				this.teamStream = await this.data.streams.getOneByQuery(
					{
						teamId: this.teamId,
						type: 'channel',
						isTeamStream: true
					},
					{
						hint: StreamIndexes.byType
					}
				);
				if (!this.teamStream) {
					throw this.errorHandler.error('notFound', { info: 'team stream' }); // shouldn't really happen
				}
			} else {
				this.team = await new TeamCreator({
					request: this,
					assumeTeamStreamSeqNum: 3 // for the code error post, and the reply to it, that we are going to create
				}).createTeam({
					name: 'general'
				});
				this.teamStream = this.transforms.createdTeamStream;
				this.teamWasCreated = true;
			}
		}

		// add the user to the team as needed
		await this.addUserToTeam(this.user);
	}

	// create a code error linked to the New Relic object to which the comment is attached
	async createCodeError () {
		this.codeErrorPost = await new PostCreator({
			request: this,
			assumeSeqNum: this.teamWasCreated ? 1 : undefined
		}).createPost({
			streamId: this.teamStream.id,
			dontSendEmail: true,
			codeError: {
				objectId: this.request.body.objectId,
				objectType: this.request.body.objectType,
				accountId: this.request.body.accountId
			}
		});
		this.codeError = this.transforms.createdCodeError;
	}

	// create the actual post, as a reply to the post pointing to the code error
	async createPost () {
		this.postCreator = new PostCreator({ 
			request: this,
			assumeSeqNum: this.teamWasCreated ? 2 : undefined // because the actual code error was 1
		});
		this.post = await this.postCreator.createPost({
			parentPostId: this.codeError.get('postId'),
			streamId: this.codeError.get('streamId'),
			text: this.request.body.text,
			mentionedUserIds: this.mentionedUserIds
		});
	}

	// handle the response to the request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// return customized response data to New Relic
		this.responseData = Utils.ToNewRelic(this.codeError, this.post, this.users);
		return super.handleResponse();
	}

	// after the request has been processed and response returned to the client....
	async postProcess () {
		await this.postCreator.postCreate();		
	}
}

module.exports = PostNRCommentRequest;
