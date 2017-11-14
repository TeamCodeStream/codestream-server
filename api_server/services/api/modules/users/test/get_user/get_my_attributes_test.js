'use strict';

var Get_Myself_Test = require('./get_myself_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const User_Test_Constants = require('../user_test_constants');
const User_Attributes = require('../../user_attributes');

class Get_My_Attributes_Test extends Get_Myself_Test {

	get description () {
		return 'should return me-only attributes when requesting myself';
	}

	get_expected_fields () {
		let user_response = {};
		user_response.user = [...User_Test_Constants.EXPECTED_USER_FIELDS, ...User_Test_Constants.EXPECTED_ME_FIELDS];
		return user_response;
	}

	before (callback) {
		this.id = 'me';
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

	validate_sanitized (user, fields) {
		let me_attributes = Object.keys(User_Attributes).filter(attribute => User_Attributes[attribute].for_me);
		me_attributes.forEach(attribute => {
			let index = fields.indexOf(attribute);
			if (index !== -1) {
				fields.splice(index, 1);
			}
		});
		super.validate_sanitized(user, fields);
	}
}

module.exports = Get_My_Attributes_Test;
