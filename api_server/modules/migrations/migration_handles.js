// descriptors for all database migrations

module.exports = [
	'0001-set_default_tags_for_teams',
	'0002-codemark_color_to_tag',
	'0003-codemark_permalinks',
	/*'0004-backfill_commit_hash_repos'*/ // backed out as a reconsideration of how to implement the auto-join data
	'0004-last_post_created_at_for_teams'
];
