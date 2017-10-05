'use strict';

var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var Stream = require('./stream');
const STREAM_TYPES = require('./stream_types');

class Stream_Creator extends Model_Creator {

	get model_class () {
		return Stream;
	}

	get collection_name () {
		return 'streams';
	}

	create_stream (attributes, callback) {
		return this.create_model(attributes, callback);
	}

	validate_attributes (callback) {
		this.set_defaults();
		var required_attributes = ['company_id', 'team_id', 'type'];
		var error =
			this.check_required(required_attributes) ||
			this.validate_type() ||
			this.validate_member_ids();
		callback(error);
	}

	validate_type () {
		if (STREAM_TYPES.indexOf(this.attributes.type) === -1) {
			return { type: `invalid stream type: ${value}` };
		}
		if (this.attributes.type === 'channel' && !this.attributes.name) {
			return { name: 'channel type streams must have a name' };
		}
		else if (this.attributes.type === 'file') {
			if (!this.attributes.repo_id) {
				return { repo_id: 'file type streams must have a repo_id' };
			}
			else if (!this.attributes.file) {
				return { file: 'file type streams must have a file' };
			}
		}
	}

	validate_member_ids () {
		if (type === 'file') {
			delete this.attributes.member_ids;
			return; // not required (or desired) for files
		}
		if (!(this.attributes.member_ids instanceof Array)) {
			return { member_ids: 'must be an array' };
		}
		if (type === 'direct') {
			return 'direct message streams should not have a name';
		}
	}

	set_defaults () {
		this.ensure_user_is_member();
		this.dont_save_if_exists = true;
	}

	ensure_user_is_member () {
		if (type === 'file') {
			return; // not required for files
		}
		this.attributes.member_ids = this.attributes.member_ids || [this.user._id.toString()];
		if (!(this.attributes.member_ids instanceof Array)) {
			// this will get caught later
			return;
		}
		if (this.attributes.member_ids.indexOf(this.user._id.toString()) === -1) {
			this.attributes.member_ids.push(this.user._id.toString());
		}
		this.attributes.member_ids.sort();
	}

	check_existing_query () {
		var query = {
			company_id: this.attributes.company_id,
			team_id: this.attributes.team_id
		};
		if (this.type === 'channel') {
			query.name = this.attributes.name;
		}
		else if (this.type === 'direct') {
			query.member_ids = this.attributes.member_ids;
		}
		else if (this.type === 'file') {
			query.repo_id = this.attributes.repo_id;
			query.file = this.attributes.file;
		}
		return query;
	}

	model_can_exist () {
		return this.type !== 'channel';
	}

	pre_save (callback) {
		this.attributes.creator_id = this.user._id.toString();
		super.pre_save(callback);
	}
}

module.exports = Stream_Creator;
