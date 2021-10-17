// handle a POST /code-errors/claim/:teamId request to claim a single code error for a team

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const Indexes = require("./indexes");
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const PermalinkCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/permalink_creator');

class ClaimCodeErrorRequest extends RestfulRequest {

	async authorize () {
		// user must be a member of the indicated team
		this.teamId = this.request.params.teamId.toLowerCase();
		if (!this.user.authorizeTeam(this.teamId)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not a member of this team' });
		}
	}

	async process () {
		await this.requireAndAllow();

		await this.getCodeError() &&
		await this.authorizeCodeError() &&
		await this.claimCodeError() &&
		await this.makeResponse()
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['objectId', 'objectType']
				}
			}
		);
	}
	
	// get any code error matching the object ID and object type passed
	async getCodeError () {
		const { objectId, objectType } = this.request.body;
		this.codeError = await this.data.codeErrors.getOneByQuery(
			{ objectId, objectType },
			{ hint: Indexes.byobjectId}
		);
		if (!this.codeError) {
			this.responseData = { notFound: true };
			return false;
		}
		return true;
	}

	// authorize the code error: if not owned by a team, or if i am on the team that owns it
	async authorizeCodeError () {
		const teamId = this.codeError.get('teamId');
		if (!teamId || teamId === this.teamId) {
			return true;
		} 

		this.responseData = { 
			unauthorized: true,
			accountId: this.codeError.get('accountId')
		};
		await this.getTeamAndCompany();
		if (this.company) {
			this.responseData.ownedBy = this.company.get('name');
		}
		return false;
	}

	// get the team and company that owns this code error
	async getTeamAndCompany () {
		if (!this.codeError.get('teamId')) { return; }
		this.team = await this.data.teams.getById(this.codeError.get('teamId'));
		if (!this.team || !this.team.get('companyId')) { return; }
		this.company = await this.data.companies.getById(this.team.get('companyId'));
	}

	// claim the code error for the indicated team
	async claimCodeError () {
		if (!this.codeError.get('teamId')) {
			await this.claimCodeErrorForTeam();
		}
		return true;
	}

	// claim this previously teamless code error for the indicated team
	async claimCodeErrorForTeam () {
		await awaitParallel([
			this.claimPosts,
			this.claimStream,
			this.createPermalink,
			this.updateCodeError,
			this.adoptUsers
		], this);
	}

	// claim all posts belonging to this code error for the team the user is currently logged into
	async claimPosts () {
		const postId = this.codeError.get('postId');
		const streamId = this.codeError.get('streamId');
		const postIds = [postId];
		const childPosts = await this.data.posts.getByQuery(
			{ 
				teamId: null, 
				streamId,
				parentPostId: postId,
			},
			{
				hint: PostIndexes.byParentPostId
			}
		);
		const grandChildPosts = await this.data.posts.getByQuery(
			{
				teamId: null,
				streamId,
				parentPostId: this.data.posts.inQuery(childPosts.map(post => post.id))
			},
			{
				hint: PostIndexes.byParentPostId
			}
		);
		postIds.push.apply(postIds, childPosts.map(post => post.id), grandChildPosts.map(post => post.id));

		return this.data.posts.updateDirectWhenPersist(
			{ id: this.data.posts.inQuerySafe(postIds) },
			{ $set: { teamId: this.teamId } }
		);
	}

	// claim the stream associated with the code error for the team the user is currently logged into
	async claimStream () {
		return this.data.streams.updateDirectWhenPersist(
			{ id: this.data.streams.objectIdSafe(this.codeError.get('streamId')) },
			{ $set: { teamId: this.teamId } }
		);
	}

	// set the team for the code error and set its permalink
	async updateCodeError () {
		return this.data.codeErrors.updateDirectWhenPersist(
			{ 
				id: this.data.codeErrors.objectIdSafe(this.codeError.id) 
			},
			{ 
				$set: { 
					teamId: this.teamId,
					permalink: this.permalink
				},
				$addToSet: {
					followerIds: this.user.id
				}
			}
		);
	}

	// "adopt" the users who have been following this code error (i.e., commenting on it in NR),
	// by making them foreign users of the team that is now going to own the code error
	async adoptUsers () {
		const team = await this.data.teams.getById(this.teamId);
		const followerIds = this.codeError.get('followerIds') || [];
		const foreignMemberIds = [];
		for (const userId of followerIds) {
			if (
				!team.get('memberIds').includes(userId) ||
				(team.get('removedMemberIds') || []).includes(userId)
			) {
				foreignMemberIds.push(userId);
			}
		}

		if (foreignMemberIds.length > 0) {
			await this.data.teams.updateDirectWhenPersist(
				{ id: this.data.teams.objectIdSafe(this.teamId) },
				{ 
					$addToSet: {
						foreignMemberIds: { 
							$each: foreignMemberIds
						},
						memberIds: {
							$each: foreignMemberIds
						}
					}
				}
			);
		}
	}

	// create a permalink url to the code error, now that it has a team
	async createPermalink () {
		this.permalink = await new PermalinkCreator({
			request: this,
			codeError: { ...this.codeError.attributes, teamId: this.teamId }
		}).createPermalink();
	}

	/*
	// make the current user a follower of this code error
	async makeFollower () {
		if ((this.codeError.get('followerIds') || []).includes(this.user.id)) {
			return;
		}

		const now = Date.now();
		const op = {
			$addToSet: {
				followerIds: this.user.id
			},
			$set: {
				modifiedAt: now
			}
		};

		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.codeErrors,
			id: this.codeError.id
		}).save(op);
	}
	*/
	
	/*
	// called after the response is returned
	async postProcess () {
		if (!this.updateOp) { return; }
		new CodeErrorPublisher({
			codeError: this.codeError,
			request: this,
			data: { codeError: this.updateOp }
		}).publishCodeError();
	}
	*/

	// make the response data for a successful claim
	async makeResponse () {
		const post = await this.data.posts.getById(this.codeError.get('postId'));
		if (!post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		const postSanitized = post.getSanitizedObject({ request: this });

		const stream = await this.data.streams.getById(this.codeError.get('streamId'));
		if (!stream) {
			throw this.errorHandler.error('notFOund', { info: 'stream' });
		}
		const streamSanitized = stream.getSanitizedObject({ request: this });

		const codeErrorSanitized = this.codeError.getSanitizedObject({ request: this });

		this.responseData = {
			codeError: { ...codeErrorSanitized, teamId: this.teamId },
			post: { ...postSanitized, teamId: this.teamId },
			stream: { ...streamSanitized, teamId: this.teamId }
		};
	}
}

module.exports = ClaimCodeErrorRequest;
