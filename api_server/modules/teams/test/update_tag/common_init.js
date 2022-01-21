// base class for many tests of the "PUT /team-tags/:teamId/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UUID = require('uuid').v4;
const RandomString = require('randomstring');
const DefaultTags = require('../../default_tags');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 3;
		this.userOptions.numUnregistered = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.createTags,
			this.makeUpdateData	// make the data to be used during the update
		], callback);
	}
	
	// create some tags, one of which we will update
	createTags (callback) {
		this.tagsCreated = {};
		BoundAsync.timesSeries(
			this,
			3,
			this.createTag,
			callback
		);
	}

	// create a single tag
	createTag (n, callback) {
		const tagId = UUID().split('-').join('');
		this.doApiRequest(
			{
				method: 'post',
				path: '/team-tags/' + this.team.id,
				data: {
					id: tagId,
					color: RandomString.generate(6),
					label: RandomString.generate(10),
					sortOrder: Math.floor(Math.random() * 100)
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.tagsCreated[tagId] = response.team.$set[`tags.${tagId}`];
				callback();
			}
		);
	}

	// form the data for the team update
	makeUpdateData (callback) {
		this.tagId = Object.keys(this.tagsCreated)[1];
		this.path = `/team-tags/${this.team.id}/${this.tagId}`;
		this.data = {
			color: RandomString.generate(6),
			label: RandomString.generate(20),
			sortOrder: Math.floor(Math.random() * 100)
		};
		this.updatedAt = Date.now();
		this.expectedResponse = {
			team: {
				id: this.team.id,
				_id: this.team.id,
				$set: {
					[`tags.${this.tagId}`]: this.data,
					modifiedAt: Date.now(),
					version: 9
				},
				$version: {
					before: 8,
					after: 9
				}
			}
		};
		this.expectedTags = { ...DeepClone(DefaultTags), ...this.tagsCreated };
		this.expectedTags[this.tagId] = { ...this.data };
		callback();
	}

	// update the actual tag
	updateTag (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/team-tags/${this.team.id}/${this.tagId}`,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.updateTagResponse = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
