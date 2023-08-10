// handle the "GET /code-errors" request to fetch multiple code code error objects

'use strict';

const ObjectId = require('mongodb').ObjectId;
const GetManyRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetCodeErrorsRequest extends GetManyRequest {

	// authorize the request
	async authorize () {
		// authorize against the team, this is required
		this.teamId = this.request.query.teamId;
		if (!this.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.teamId = this.teamId.toLowerCase();
		const authorized = await this.user.authorizeTeam(this.teamId, this);
		if (!authorized) {
			throw this.errorHandler.error('readAuth', { reason: 'user not on team' });
		}
	}

	// process the request...
	async process () {
		await super.process();	// do the usual "get-many" processing
		await this.getPosts();	// get associated posts, as needed
	}

	// build the database query to use to fetch the code errors
	buildQuery () {
		const query = { teamId: this.teamId, deactivated: false };
		const indexAttribute = 'lastActivityAt';
		let { before, after, inclusive } = this.request.query;
		inclusive = inclusive !== undefined;
		if (before !== undefined) {
			before = parseInt(before, 10);
			if (!before) {
				return 'before must be a number';
			}
			query[indexAttribute] = query[indexAttribute] || {};
			if (inclusive) {
				query[indexAttribute].$lte = before;
			}
			else {
				query[indexAttribute].$lt = before;
			}
		}
		if (after !== undefined) {
			after = parseInt(after, 10);
			if (!after) {
				return 'after must be a number';
			}
			query[indexAttribute] = query[indexAttribute] || {};
			if (inclusive) {
				query[indexAttribute].$gte = after;
			}
			else {
				query[indexAttribute].$gt = after;
			}
		}
		return query;
	}

	// get database options to associate with the database fetch request
	getQueryOptions () {
		return {
			hint: Indexes.byLastActivityAt,
			sort: { lastActivityAt: -1 }
		};
	}

	// get the posts pointing to the fetched code errors, as needed
	async getPosts () {
		const postIds = this.models.map(codeError => ObjectId(codeError.get('postId')));
		if (postIds.length === 0) {
			return;
		}
		this.posts = await this.data.posts.getByQuery(
			{
				_id: { $in: postIds },
				deactivated: false
			},
			{
				hint: {
					_id: 1,
				}
			}
		);
		this.responseData.posts = this.posts.map(post => post.getSanitizedObject({ request: this }));
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.description = 'Returns an array of code errors owned by a team, optionally providing a stream ID; always returns any associated posts';
		description.access = 'User must be a member of the team specified';
		Object.assign(description.input.looksLike, {
			'teamId*': '<ID of the team for which codemarks are being fetched>',
			'streamId': '<ID of the stream for which codemarks should be fetched>',
			'byLastActivityAt': '<boolean indicates to fetch and sort by lastActivityAt, instead of createdAt>',
			'before': '<Fetch codemarks created before this timestamp, inclusive if "inclusive" is set>',
			'after': '<Fetch codemarks created after this timestamp, inclusive if "inclusive" is set>',
			'inclusive': '<If before or after or both are set, indicates to include any codemarks with a timestamp exactly matching the before or after vaue (or both)>'
		});
		description.returns.summary = 'An array of code error objects, plus possible post objects';
		Object.assign(description.returns.looksLike, {
			codeErrors: '<@@#code error objects#codeError@@ fetched>',
			posts: '<associated @@#post objects#post@@>'
		});
		description.errors = description.errors.concat([
			'invalidParameter',
			'parameterRequired'
		]);
		return description;
	}
}

module.exports = GetCodeErrorsRequest;
