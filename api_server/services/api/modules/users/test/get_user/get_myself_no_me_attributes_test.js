'use strict';

var Get_Myself_Test = require('./get_myself_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
const User_Attributes = require('../../user_attributes');

class Get_Myself_No_Me_Attributes_Test extends Get_Myself_Test {

	get description () {
		return 'should not return me-only attributes when requesting myself by id';
	}

	before (callback) {
		this.id = this.current_user._id;
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_repo,
			this.create_stream,
			this.create_post,
			super.before
		], callback);
	}

	create_other_user (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				callback();
			}
		);
	}

	create_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				with_emails: [this.current_user.email],
				with_random_emails: 1,
				token: this.other_user_data.access_token
			}
		);
	}

	create_stream (callback) {
		let stream_options = {
			type: 'file',
			team_id: this.team._id,
			repo_id: this.repo._id,
			token: this.other_user_data.access_token
		};
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			stream_options
		);
	}

	create_post (callback) {
		let post_options = {
			stream_id: this.stream._id,
			token: this.other_user_data.access_token
		};
		this.post_factory.create_random_post(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			post_options
		);
	}

	validate_response (data) {
		let user = data.user;
		let found_me_attributes = [];
		let me_attributes = Object.keys(User_Attributes).filter(attribute => User_Attributes[attribute].for_me);
		me_attributes.forEach(attribute => {
			if (user.hasOwnProperty(attribute)) {
				found_me_attributes.push(attribute);
			}
		});
		Assert(found_me_attributes.length === 0, 'response contains these me-only attributes: ' + found_me_attributes.join(','));
	}
}

module.exports = Get_Myself_No_Me_Attributes_Test;
