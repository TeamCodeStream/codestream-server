'use strict';

var GetUnreadStreamsTest = require('./get_unread_streams_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GetNoUnreadStreamsTest extends GetUnreadStreamsTest {

	get description () {
		return 'should return no streams when asking for streams with unread messages and there are none';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.readAll
		], callback);
	}

	readAll (callback) {
		this.doApiRequest({
			method: 'put',
			path: '/read/all',
			token: this.token
		}, error => {
			if (error) { return callback(error); }
			this.myStreams = [];
			callback();
		});
	}
}

module.exports = GetNoUnreadStreamsTest;
