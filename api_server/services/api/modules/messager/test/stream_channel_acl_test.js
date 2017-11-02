'use strict';

var CodeStream_Message_ACL_Test = require('./codestream_message_acl_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Stream_Channel_ACL_Test extends CodeStream_Message_ACL_Test {

	get description () {
		return 'should get an error when trying to subscribe to a stream channel for a stream i am not a member of';
	}

	make_data (callback) {
		Bound_Async.series(this, [
			this.create_repo,
			this.create_stream
		], callback);
	}

	create_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				with_random_emails: 2,
				with_emails: [this.other_user_data.user.email],
				token: this.token
			}
		);
	}

	create_stream (callback) {
		let stream_users = this.users.filter(user => user._id !== this.other_user_data.user._id);
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'channel',
				team_id: this.team._id,
				member_ids: stream_users.map(user => user._id),
				token: this.token
			}
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'stream-' + this.stream._id;
		callback();
	}
}

module.exports = Stream_Channel_ACL_Test;
