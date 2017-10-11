'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
var Post_Group_Post_Test = require('./post_group_post_test');

class Post_Post_On_The_Fly_Group_Test extends Post_Group_Post_Test {

	get description () {
		return 'should return a valid post for new group if group attributes are provided';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.get_group_data
		], callback);
	}

	get_group_data (callback) {
		this.group_factory.get_random_group_data(
			(error, users, group) => {
				if (error) { return callback(error); }
				this.data.group = {
					member_ids: group.member_ids
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
		let members_with_current_user = [this.current_user._id, ...this.data.group.member_ids];
		members_with_current_user.sort();
		Assert(
			group &&
			group.member_ids instanceof Array &&
			members_with_current_user instanceof Array &&
			JSON.stringify(group.member_ids) === JSON.stringify(members_with_current_user),
			'group membership doesn\'t match the group requested'
		);
	}
}

module.exports = Post_Post_On_The_Fly_Group_Test;
