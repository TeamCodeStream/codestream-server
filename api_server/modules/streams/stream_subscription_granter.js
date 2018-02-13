// handles granting permission to the users in a stream to subscribe to the messager channel
// appropriate to the stream

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class StreamSubscriptionGranter  {

	constructor (options) {
		Object.assign(this, options);
	}

	// grant permission to the users of a stream to subscribe to the stream channel
	grantToMembers (callback) {
		BoundAsync.series(this, [
			this.getUsers,			// get the stream users, since only registered users can access
			this.getTokens,			// get the users' tokens
			this.grantStreamChannel	// grant the permissions
		], callback);
	}

	// get the users in a stream
	getUsers (callback) {
		if (this.members) {
			return callback();
		}
		this.data.users.getByIds(
			this.stream.get('memberIds') || [],
			(error, members) => {
				if (error) { return callback(error); }
				this.members = members;
				callback();
			},
			{
				// only need these fields
				fields: ['isRegistered', 'accessToken']
			}
		);
	}

	// get the access tokens for each user in the stream that is registered
	getTokens (callback) {
		this.tokens = [];
		BoundAsync.forEachLimit(
			this,
			this.members,
			10,
			this.getTokenForRegisteredUser,
			callback
		);
	}

	// get the access token for a registered user in the stream
	getTokenForRegisteredUser (user, callback) {
		if (user.get('isRegistered')) {
			this.tokens.push(user.get('accessToken'));
		}
		process.nextTick(callback);
	}

	// grant permissions for each registered user to subscribe to the stream channel
	grantStreamChannel (callback) {
		if (this.tokens.length === 0) {
			return callback();
		}
		let channel = 'stream-' + this.stream.id;
		this.messager.grant(
			this.tokens,
			channel,
			(error) => {
				if (error) {
					 return callback(`unable to grant permissions for subscription (${channel}): ${error}`);
				}
				else {
					return callback();
				}
			},
			{
				request: this.request
			}
		);
	}
}

module.exports = StreamSubscriptionGranter;
