// handle the "GET /markers" request to fetch multiple markers

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetMarkersRequest extends GetManyRequest {

	// authorize the request
	async authorize () {
		const info = await this.user.authorizeFromTeamIdAndStreamId(
			this.request.query,
			this,
			{ mustBeFileStream: true }
		);
		Object.assign(this, info);
	}

	// process the request...
	async process () {
		await super.process();				// do the usual "get-many" processing
		await this.getCodeMarks();	// get associated codemarks, as needed
		await this.getPosts();	// get associated posts, as needed
		await this.fetchMarkerLocations();	// if the user passes a commit hash, we give them whatever marker locations we have for that commit
	}

	// build the database query to use to fetch the markers
	buildQuery () {
		const query = {
			teamId: this.teamId,
			fileStreamId: this.streamId
		};
		if (this.request.query.ids) {
			// user specified some IDs, so restrict to those IDs
			let ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			if (ids.length > 100) {
				return 'too many IDs';
			}
			query._id = this.data.markers.inQuerySafe(ids);
		}
		let { before, after, inclusive } = this.request.query;
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
		return { 
			hint: Indexes.byFileStreamId,
			sort: { createdAt: -1 } 
		};
	}

	// get the codemarks associated with the fetched markers, as needed
	async getCodeMarks () {
		const codemarkIds = this.models.map(marker => marker.get('codemarkId'));
		if (codemarkIds.length === 0) {
			return;
		}
		this.codemarks = await this.data.codemarks.getByIds(codemarkIds);
		this.responseData.codemarks = this.codemarks.map(codemark => codemark.getSanitizedObject());
	}

	// get the posts pointing to the fetched markers, as needed
	async getPosts () {
		if (!this.codemarks) { return; }
		const postIds = this.codemarks
			.filter(codemark => !codemark.get('providerType'))
			.map(codemark => codemark.get('postId'));
		if (postIds.length === 0) {
			return;
		}
		this.posts = await this.data.posts.getByIds(postIds);
		this.responseData.posts = this.posts.map(post => post.getSanitizedObject());
	}

	// if the user provides a commit hash, we'll fetch marker locations associated with the markers for the stream,
	// if we can find any
	async fetchMarkerLocations () {
		if (!this.request.query.commitHash) {
			// no commit hash, so we're just returning markers with no location info
			return;
		}
		this.commitHash = this.request.query.commitHash.toLowerCase();
		const query = {
			// teamId: this.teamId, // will be needed for sharding, but for now, we'll avoid an index here
			_id: `${this.streamId}|${this.commitHash}`
		};
		const markerLocations = await this.data.markerLocations.getByQuery(
			query,
			{ hint: { _id: 1 } }
		);
		if (markerLocations.length === 0) {
			// no marker locations for this commit, oh well
			this.responseData.markerLocations = {};
			return;
		}
		this.markerLocations = markerLocations[0];
		this.responseData.markerLocations = this.markerLocations.getSanitizedObject();
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.description = 'Returns an array of markers for a given file (given by stream ID), governed by the query parameters; if a commit hash is specified, will also return marker locations for the fetched markers, for the given commit hash. Also returns any associated knowledge-base codemarks, as well as any referencing posts.';
		description.access = 'User must be a member of the team that owns the file stream to which the markers belong';
		Object.assign(description.input.looksLike, {
			'teamId*': '<ID of the team that owns the file stream for which markers are being fetched>',
			'streamId*': '<ID of the file stream for which markers are being fetched>',
			'commitHash': '<Commit hash for which marker locations should be returned, along with the fetched markers>'
		});
		description.returns.summary = 'An array of marker objects, plus possible post and codemark objects, and markerLocations object as requested';
		Object.assign(description.returns.looksLike, {
			markers: '<@@#marker objects#codemark@@ fetched>',
			codemarks: '<associated @@#codemark objects#codemark@@>',
			posts: '<referencing @@#post objects#post@@>',
			markerLocations: '<@@#marker locations object#markerLocations@@>'
		});
		description.errors = description.errors.concat([
			'invalidParameter',
			'parameterRequired'
		]);
		return description;
	}
}

module.exports = GetMarkersRequest;
