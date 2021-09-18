'use strict';

const DeleteMarkerTest = require('./delete_marker_test');

class AlreadyDeletedTest extends DeleteMarkerTest {

	get description() {
		return 'should return an error when trying to delete a marker that has already been deleted';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1014'
		};
	}

	// before the test runs...
	before(callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// delete the user, ahead of time...
			this.doApiRequest(
				{
					method: 'delete',
					path: '/markers/' + this.marker.id,
					token: this.token
				},
				callback
			);
		});
	}
}

module.exports = AlreadyDeletedTest;
