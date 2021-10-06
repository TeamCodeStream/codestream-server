// handle the "GET /code-errors" request to fetch multiple code code error objects

'use strict';

const GetManyRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetCodeErrorsRequest extends GetManyRequest {

	// authorize the request
	async authorize () {
		// no authorization required, returns all code errors followed by the user
	}

	// process the request...
	async process () {
		await super.process();	// do the usual "get-many" processing
		await this.getPosts();	// get associated posts, as needed
	}

	// called before running the fetch query
	async preQueryHook () {
		// get code errors followed by this user
		const codeErrors = await this.data.codeErrors.getByQuery(
			{
				followerIds: this.user.id
			},
			{
				hint: Indexes.byFollowerIds,
				fields: ['streamId'],
				noCache: true
			}
		);
		this.streamIds = codeErrors.map(codeError => codeError.streamId);
	}
	
	// build the database query to use to fetch the code errors
	buildQuery () {
		const query = {
			streamId: this.data.posts.inQuery(this.streamIds)
		};
		let { before, after, inclusive } = this.request.query;
		inclusive = inclusive !== undefined;
		if (before !== undefined) {
			before = parseInt(before, 10);
			if (!before) {
				return 'before must be a number';
			}
			query.lastActivityAt = query.lastActivityAt || {};
			if (inclusive) {
				query.lastActivityAt.$lte = before;
			}
			else {
				query.lastActivityAt.$lt = before;
			}
		}
		if (after !== undefined) {
			after = parseInt(after, 10);
			if (!after) {
				return 'after must be a number';
			}
			query.lastActivityAt = query.lastActivityAt || {};
			if (inclusive) {
				query.lastActivityAt.$gte = after;
			}
			else {
				query.lastActivityAt.$gt = after;
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
		const postIds = this.models.map(codeError => codeError.get('postId'));
		if (postIds.length === 0) {
			return;
		}
		this.posts = await this.data.posts.getByIds(postIds);
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
