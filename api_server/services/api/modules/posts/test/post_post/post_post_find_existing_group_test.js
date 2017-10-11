'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
var Post_Group_Post_Test = require('./post_group_post_test');

class Post_Post_Find_Existing_Group_Test extends Post_Group_Post_Test {

	get description () {
		return 'should return a valid post for existing group if group attributes of existing group are provided';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.get_group_data
		], callback);
	}

	get_group_data (callback) {
		this.group_factory.create_random_group(
			(error, data) => {
				if (error) { return callback(error); }
				this.data.group = {
					member_ids: data.group.member_ids
				};
				callback();
			},
			{
				org: this.current_orgs[0],
				token: this.token
			}
		);
	}

	validate_response (data) {
		super.validate_response(data);
		let group = data.group;
		Assert(
			group &&
			group.member_ids instanceof Array &&
			this.data.group.member_ids instanceof Array &&
			JSON.stringify(group.member_ids) === JSON.stringify(this.data.group.member_ids),
			'group membership doesn\'t match the group requested'
		);
	}
}

module.exports = Post_Post_Find_Existing_Group_Test;
