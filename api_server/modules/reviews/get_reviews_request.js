// handle the "GET /reviews" request to fetch multiple code review objects

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetReviewsRequest extends GetManyRequest {

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
		await this.getMarkers();	// get associated markers, as needed
	}

	// build the database query to use to fetch the reviews
	buildQuery () {
		let numParameters = ['streamId'].reduce((numParameters, parameter) => {
			return numParameters + (this.request.query[parameter] ? 1 : 0);
		}, 0);
		if (numParameters > 1) {
			return 'can not query on more than one of: streamId';
		}
		if (numParameters === 1 && this.request.query.byLastActivityAt) {
			return 'can not query on streamId and also on lastActivityAt';
		}
		const query = {
			teamId: this.teamId
		};
		if (this.request.query.streamId) {
			query.streamId = this.request.query.streamId.toLowerCase();
		}
		const indexAttribute = this.request.query.byLastActivityAt ? 'lastActivityAt' : 'createdAt';
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
		let hint;
		if (this.request.query.streamId) {
			hint = Indexes.byStreamId;
		}
		else if (this.request.query.byLastActivityAt) {
			hint = Indexes.byLastActivityAt;
		}
		else {
			hint = Indexes.byTeamId;
		}
		const sortAttribute = this.request.query.byLastActivityAt ? 'lastActivityAt' : 'createdAt';
		return {
			hint,
			sort: { [sortAttribute]: -1 }
		};
	}

	// get the posts pointing to the fetched reviews, as needed
	async getPosts () {
		const postIds = this.models.map(review => review.get('postId'));
		if (postIds.length === 0) {
			return;
		}
		this.posts = await this.data.posts.getByIds(postIds);
		this.responseData.posts = this.posts.map(post => post.getSanitizedObject({ request: this }));
	}

	// get the markers associated with the fetched codemarks, as needed
	async getMarkers () {
		const markerIds = this.models.reduce((markerIds, review) => {
			markerIds.push(...(review.get('markerIds') || []));
			return markerIds;
		}, []);
		if (markerIds.length === 0) {
			return;
		}
		this.markers = await this.data.markers.getByIds(markerIds);
		this.responseData.markers = this.markers.map(marker => marker.getSanitizedObject({ request: this }));
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.description = 'Returns an array of reviews owned by a team, optionally providing a stream ID; always returns any associated posts';
		description.access = 'User must be a member of the team specified';
		Object.assign(description.input.looksLike, {
			'teamId*': '<ID of the team for which codemarks are being fetched>',
			'streamId': '<ID of the stream for which codemarks should be fetched>',
			'byLastActivityAt': '<boolean indicates to fetch and sort by lastActivityAt, instead of createdAt>',
			'before': '<Fetch codemarks created before this timestamp, inclusive if "inclusive" is set>',
			'after': '<Fetch codemarks created after this timestamp, inclusive if "inclusive" is set>',
			'inclusive': '<If before or after or both are set, indicates to include any codemarks with a timestamp exactly matching the before or after vaue (or both)>'
		});
		description.returns.summary = 'An array of review objects, plus possible post objects';
		Object.assign(description.returns.looksLike, {
			reviews: '<@@#review objects#review@@ fetched>',
			posts: '<associated @@#post objects#post@@>'
		});
		description.errors = description.errors.concat([
			'invalidParameter',
			'parameterRequired'
		]);
		return description;
	}
}

module.exports = GetReviewsRequest;
