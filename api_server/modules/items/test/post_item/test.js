// handle unit tests for the "POST /items" request to create a knowledge base item

'use strict';

const PostItemTest = require('./post_item_test');
const MarkerTest = require('./marker_test');
const NoAttributeTest = require('./no_attribute_test');
const NoCommitHashTest = require('./no_commit_hash_test');
const NoCommitHashWithFileTest = require('./no_commit_hash_with_file_test');
const NoCommitHashWithStreamTest = require('./no_commit_hash_with_stream_test');
const NoCommitHashWithStreamIdTest = require('./no_commit_hash_with_stream_id_test');
const MarkersNotArrayTest = require('./markers_not_array_test');
const MarkersTooLongTest = require('./markers_too_long_test');
const MarkerNotObjectTest = require('./marker_not_object_test');
const MarkerAttributeRequiredTest = require('./marker_attribute_required_test');
const LocationTooLongTest = require('./location_too_long_test');
const LocationTooShortTest = require('./location_too_short_test');
const LocationMustBeNumbersTest = require('./location_must_be_numbers_test');
const InvalidCoordinateObjectTest = require('./invalid_coordinate_object_test');
const NoLocationOkTest = require('./no_location_ok_test');
const TooManyRemotesTest = require('./too_many_remotes_test');
const MarkerHasInvalidStreamIdTest = require('./marker_has_invalid_stream_id_test');
const MarkerHasUnknownStreamIdTest = require('./marker_has_unknown_stream_id_test');
const MarkerHasInvalidRepoIdTest = require('./marker_has_invalid_repo_id_test');
const MarkerHasUnknownRepoIdTest = require('./marker_has_unknown_repo_id_test');
const MarkerForBadStreamTypeTest = require('./marker_for_bad_stream_type_test');
const MarkerFromDifferentTeamTest = require('./marker_from_different_team_test');
const MarkerStreamOnTheFly = require('./marker_stream_on_the_fly_test');
const FindRepoByRemotesTest = require('./find_repo_by_remotes_test');
const UpdateMatchedRepoWithRemotesTest = require('./update_matched_repo_with_remotes_test');
const UpdateSetRepoWithRemotesTest = require('./update_set_repo_with_remotes_test');
const CreateRepoOnTheFlyTest = require('./create_repo_on_the_fly_test');
const DuplicateFileStreamTest = require('./duplicate_file_stream_test');
const NewMarkerStreamMessageToTeamTest = require('./new_marker_stream_message_to_team_test');
const NewRepoMessageToTeamTest = require('./new_repo_message_to_team_test');
const UpdatedSetRepoMessageTest = require('./updated_set_repo_message_test');
const OnTheFlyMarkerStreamFromDifferentTeamTest = require('./on_the_fly_marker_stream_from_different_team_test');
const OnTheFlyMarkerStreamRepoNotFoundTest = require('./on_the_fly_marker_stream_repo_not_found_test');
const OnTheFlyMarkerStreamNoRemotesTest = require('./on_the_fly_marker_stream_no_remotes_test');
const OnTheFlyMarkerStreamInvalidRepoIdTest = require('./on_the_fly_marker_stream_invalid_repo_id_test');
const ACLTeamTest = require('./acl_team_test');
const TeamNotFoundTest = require('./team_not_found_test');
const EmptyPostIdTest = require('./empty_post_id_test');

class PostItemRequestTester {

	test () {
		new PostItemTest().test();
		new MarkerTest().test();
		new NoAttributeTest({ attribute: 'type' }).test();
		new NoAttributeTest({ attribute: 'teamId' }).test();
		new NoAttributeTest({ attribute: 'providerType' }).test();
		new NoAttributeTest({ attribute: 'streamId' }).test();
		new NoCommitHashTest().test();
		new NoCommitHashWithFileTest().test();
		new NoCommitHashWithStreamTest().test();
		new NoCommitHashWithStreamIdTest().test();
		new MarkersNotArrayTest().test();
		new MarkersTooLongTest().test();
		new MarkerNotObjectTest().test();
		new MarkerAttributeRequiredTest({ attribute: 'code' }).test();
		new LocationTooLongTest().test();
		new LocationTooShortTest().test();
		new LocationMustBeNumbersTest().test();
		new InvalidCoordinateObjectTest().test();
		new NoLocationOkTest().test();
		new TooManyRemotesTest().test();
		new MarkerHasInvalidStreamIdTest().test();
		new MarkerHasUnknownStreamIdTest().test();
		new MarkerHasInvalidRepoIdTest().test();
		new MarkerHasUnknownRepoIdTest().test();
		new MarkerForBadStreamTypeTest({ streamType: 'direct' }).test();
		new MarkerForBadStreamTypeTest({ streamType: 'channel' }).test();
		new MarkerFromDifferentTeamTest().test();
		new MarkerStreamOnTheFly({ streamType: 'direct' }).test();
		new MarkerStreamOnTheFly({ streamType: 'channel' }).test();
		new FindRepoByRemotesTest().test();
		new UpdateMatchedRepoWithRemotesTest().test();
		new UpdateSetRepoWithRemotesTest().test();
		new CreateRepoOnTheFlyTest().test();
		new DuplicateFileStreamTest().test();
		new NewMarkerStreamMessageToTeamTest().test();
		new NewRepoMessageToTeamTest().test();
		new UpdatedSetRepoMessageTest().test();
		new OnTheFlyMarkerStreamFromDifferentTeamTest().test();
		new OnTheFlyMarkerStreamRepoNotFoundTest().test();
		new OnTheFlyMarkerStreamNoRemotesTest().test();
		new OnTheFlyMarkerStreamInvalidRepoIdTest().test();
		new ACLTeamTest().test();
		new TeamNotFoundTest().test();
		new EmptyPostIdTest().test();
	}
}

module.exports = new PostItemRequestTester();
