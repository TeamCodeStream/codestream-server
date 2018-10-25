// handle unit tests for the "POST /markers" request to create a marker

'use strict';

const PostMarkerTest = require('./post_marker_test');
const TeamNotFoundTest = require('./team_not_found_test');
const ACLTeamTest = require('./acl_team_test');
const StreamNoMatchTeamTest = require('./stream_no_match_team_test');
const NotFileStreamTest = require('./not_file_stream_test');
const NoAttributeTest = require('./no_attribute_test');
const StreamOnTheFlyTest = require('./stream_on_the_fly_test');
const LocationMustBeArrayTest = require('./location_must_be_array_test');
const LocationTooShortTest = require('./location_too_short_test');
const LocationTooLongTest = require('./location_too_long_test');
const LocationMustBeNumbersTest = require('./location_must_be_numbers_test');
const FifthLocationElementMustBeObjectTest = require('./fifth_location_element_must_be_object_test');
const TooManyRemotesTest = require('./too_many_remotes_test');
const CommitHashRequiredTest = require('./commit_hash_required_test');
const CommitHashRequiredForStreamOnTheFlyTest = require('./commit_hash_required_for_stream_on_the_fly_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const RepoNotFoundTest = require('./repo_not_found_test');
const RepoOnTheFlyTest = require('./repo_on_the_fly_test');
const FindRepoByRemotesTest = require('./find_repo_by_remotes_test');
const UpdateMatchedRepoWithRemotesTest = require('./update_matched_repo_with_remotes_test');
const UpdateSetRepoWithRemotesTest = require('./update_set_repo_with_remotes_test');
const MessageToTeamTest = require('./message_to_team_test');
const MessageToTeamOnTheFlyTest = require('./message_to_team_on_the_fly_test');
const NoPostIdTest = require('./no_post_id_test');
const ExtendedAttributesTest = require('./extended_attributes_test');

class PostMarkerRequestTester {

	postMarkerTest () {
		new PostMarkerTest().test();
		new TeamNotFoundTest().test();
		new ACLTeamTest().test();
		new StreamNoMatchTeamTest().test();
		new NotFileStreamTest({ streamType: 'channel' }).test();
		new NotFileStreamTest({ streamType: 'direct' }).test();
		new NoAttributeTest({ attribute: 'teamId' }).test();
		new NoAttributeTest({ attribute: 'code' }).test();
		new NoAttributeTest({ attribute: 'postStreamId' }).test();
		new NoAttributeTest({ attribute: 'providerType' }).test();
		new StreamOnTheFlyTest().test();
		new LocationMustBeArrayTest().test();
		new LocationTooShortTest().test();
		new LocationTooLongTest().test();
		new LocationMustBeNumbersTest().test();
		new FifthLocationElementMustBeObjectTest().test();
		new TooManyRemotesTest().test();
		new CommitHashRequiredTest().test();
		new CommitHashRequiredForStreamOnTheFlyTest().test();
		new StreamNotFoundTest().test();
		new RepoNotFoundTest().test();
		new RepoOnTheFlyTest().test();
		new FindRepoByRemotesTest().test();
		new UpdateMatchedRepoWithRemotesTest().test();
		new UpdateSetRepoWithRemotesTest().test();
		new MessageToTeamTest().test();
		new MessageToTeamOnTheFlyTest().test();
		new NoPostIdTest().test();
		new ExtendedAttributesTest().test();
	}
}

module.exports = PostMarkerRequestTester;
