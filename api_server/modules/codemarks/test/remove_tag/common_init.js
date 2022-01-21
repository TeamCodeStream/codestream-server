// base class for many tests of the "PUT /codemarks/:id/remove-tag" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const RandomString = require('randomstring');
const UUID = require('uuid').v4;

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.addCustomTags,		// add a couple of custom tag for the team
			this.makeCodemark, 		// make the codemark to add to
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// add a couple of custom tags for the team
	addCustomTags (callback) {
		this.tagIds = [];
		BoundAsync.timesSeries(
			this, 
			2,
			this.addCustomTag,
			callback
		);
	}

	// add a custom tag for the team, to be added to the codemark unless a default tag is desired
	addCustomTag (n, callback) {
		const tagId = UUID().split('-').join('');
		this.doApiRequest(
			{
				method: 'post',
				path: '/team-tags/' + this.team.id,
				data: {
					id: tagId,
					color: RandomString.generate(8),
					label: RandomString.generate(10),
					sortOrder: Math.floor(Math.random(100))
				},
				token: this.users[1].accessToken
			},
			error => {
				if (error) { return callback(error); }
				this.tagIds.push(tagId);
				if (n === 0 && !this.tagId) {
					this.tagId = tagId;
				}
				else if (n === 1) {
					this.otherTagId = tagId;
				}
				callback();
			}
		);
	}

	// make a single codemark to remove a tag from
	makeCodemark (callback) {
		const data = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(data, {
			teamId: this.team.id,
			providerType: RandomString.generate(8)
		});
		data.markers = [this.markerFactory.getRandomMarkerData()];
		data.tags = [this.tagId];
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				callback();
			}
		);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		this.expectedResponse = {
			codemark: {
				_id: this.codemark.id,	// DEPRECATE ME
				id: this.codemark.id,
				$set: {
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$pull: {
					tags: this.tagId
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}

			}
		};
		this.modifiedAfter = Date.now();
		this.path = `/codemarks/${this.codemark.id}/remove-tag`;
		this.data = {
			tagId: this.tagId
		};
		this.expectedCodemark = DeepClone(this.codemark);
		this.expectedCodemark.tags = this.expectedCodemark.tags || [];
		const index = this.expectedCodemark.tags.indexOf(this.tagId);
		this.expectedCodemark.tags.splice(index, 1);
		callback();
	}

	// perform the actual tag removal
	removeTag (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/codemarks/${this.codemark.id}/remove-tag`,
				data: {
					tagId: this.tagId
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = CommonInit;
