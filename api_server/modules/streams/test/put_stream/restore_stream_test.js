'use strict';

const PutStreamFetchTest = require('./put_stream_fetch_test');

class RestoreStreamTest extends PutStreamFetchTest {

	get description () {
		return 'should return the updated stream with isArchived set to false when restoring a stream';
	}

	// perform the actual stream update 
	updateStream (callback) {
		// before doing the actual update that sets isArchived to false,
		// we'll set isArchived to true
		this.doApiRequest(
			{
				method: 'put',
				path: `/streams/${this.stream.id}`,
				data: { isArchived: true },
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.expectedVersion = 3;
				super.updateStream(callback);
			}
		);
	}

	// get the data for the stream update
	getUpdateData () {
		return {
			isArchived: false
		};
	}
}

module.exports = RestoreStreamTest;
