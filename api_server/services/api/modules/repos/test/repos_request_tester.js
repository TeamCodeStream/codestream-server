'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/lib/util/aggregation');
//var Get_Repo_Request_Tester = require('./get_repo/get_repo_request_tester');
//var Get_Repos_Request_Tester = require('./get_repos/get_repos_request_tester');
var Post_Repo_Request_Tester = require('./post_repo/post_repo_request_tester');

class Repos_Request_Tester extends Aggregation(
//	Get_Repo_Request_Tester,
//	Get_Repos_Request_Tester,
	Post_Repo_Request_Tester
) {
}

module.exports = Repos_Request_Tester;
