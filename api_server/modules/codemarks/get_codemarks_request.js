// handle the "GET /codemarks" request to fetch multiple knowledge base codemarks

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetCodemarksRequest extends GetManyRequest {

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

	// build the database query to use to fetch the markers
	buildQuery () {
		let numParameters = ['type', 'fileStreamId', 'streamId'].reduce((numParameters, parameter) => {
			return numParameters + (this.request.query[parameter] ? 1 : 0);
		}, 0);
		if (numParameters > 1) {
			return 'can not query on more than one of: type, fileStreamId, and streamId';
		}
		const query = {
			teamId: this.teamId
		};
		if (this.request.query.fileStreamId) {
			query.fileStreamIds = this.request.query.fileStreamId.toLowerCase();
		}
		else if (this.request.query.streamId) {
			query.streamId = this.request.query.streamId.toLowerCase();
		}
		else if (this.request.query.type) {
			query.type = this.request.query.type;
		}
		let { before, after, inclusive } = this.request.query;
		inclusive = inclusive !== undefined;
		if (before !== undefined) {
			before = parseInt(before, 10);
			if (!before) {
				return 'before must be a number';
			}
			query.createdAt = query.createdAt || {};
			if (inclusive) {
				query.createdAt.$lte = before;
			}
			else {
				query.createdAt.$lt = before;
			}
		}
		if (after !== undefined) {
			after = parseInt(after, 10);
			if (!after) {
				return 'after must be a number';
			}
			query.createdAt = query.createdAt || {};
			if (inclusive) {
				query.createdAt.$gte = after;
			}
			else {
				query.createdAt.$gt = after;
			}
		}
		return query;
	}

	// get database options to associate with the database fetch request
	getQueryOptions () {
		let hint;
		if (this.request.query.type) {
			hint = Indexes.byType;
		}
		else if (this.request.query.fileStreamIds) {
			hint = Indexes.byFileStreamIds;
		}
		else if (this.request.query.streamId) {
			hint = Indexes.byStreamId;
		}
		else {
			hint = Indexes.byTeamId;
		}
		return {
			hint,
			sort: { createdAt: -1 }
		};
	}

	// get the posts pointing to the fetched codemarks, as needed
	async getPosts () {
		const postIds = this.models
			.filter(codemark => !codemark.get('providerType'))
			.map(codemark => codemark.get('postId'));
		if (postIds.length === 0) {
			return;
		}
		this.posts = await this.data.posts.getByIds(postIds);
		this.responseData.posts = this.posts.map(post => post.getSanitizedObject({ request: this }));
	}

	// get the markers associated with the fetched codemarks, as needed
	async getMarkers () {
		const markerIds = this.models.reduce((markerIds, codemark) => {
			markerIds.push(...(codemark.get('markerIds') || []));
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
		description.description = 'Returns an array of codemarks owned by a team, optionally providing the codemark type, a stream ID, or timestamp brackets; always returns any associated posts and markers as well';
		description.access = 'User must be a member of the team specified';
		Object.assign(description.input.looksLike, {
			'teamId*': '<ID of the team for which codemarks are being fetched>',
			'type': '<Type of codemarks to fetch>',
			'fileStreamId': '<ID of the file stream for which knowledge base codemarks with attached markers should be fetched>',
			'streamId': '<ID of the stream for which codemarks should be fetched>',
			'before': '<Fetch codemarks created before this timestamp, inclusive if "inclusive" is set>',
			'after': '<Fetch codemarks created after this timestamp, inclusive if "inclusive" is set>',
			'inclusive': '<If before or after or both are set, indicates to include any codemarks with a timestamp exactly matching the before or after vaue (or both)>'
		});
		description.returns.summary = 'An array of codemark objects, plus possible post and marker objects';
		Object.assign(description.returns.looksLike, {
			codemarks: '<@@#codemark objects#codemark@@ fetched>',
			posts: '<associated @@#post objects#post@@>',
			markers: '<associated @@#markers#markers@@>'
		});
		description.errors = description.errors.concat([
			'invalidParameter',
			'parameterRequired'
		]);
		return description;
	}
}

module.exports = GetCodemarksRequest;
