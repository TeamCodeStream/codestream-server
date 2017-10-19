'use strict';

var Model_Creator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Stream = require('./stream');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');
const Stream_Types = require('./stream_types');
const Errors = require('./errors');

class Stream_Creator extends Model_Creator {

	constructor (options) {
		super(options);
		this.error_handler.add(Errors);
		this.dont_save_if_exists = true;
	}

	get model_class () {
		return Stream;
	}

	get collection_name () {
		return 'streams';
	}

	create_stream (attributes, callback) {
		return this.create_model(attributes, callback);
	}

	get_required_attributes () {
		return ['team_id', 'type'];
	}

	validate_attributes (callback) {
		this.ensure_user_is_member();
		this.attributes.type = this.attributes.type.toLowerCase();
		if (Stream_Types.indexOf(this.attributes.type) === -1) {
			return callback(this.error_handler.error('invalid_stream_type', { info: this.attributes.type }));
		}
		if (this.attributes.type === 'channel') {
			if (!this.attributes.name) {
				return callback(this.error_handler.error('name_required'));
			}
			delete this.attributes.file;
			delete this.attributes.repo_id;
		}
		else if (this.attributes.type === 'file') {
			if (!this.attributes.repo_id) {
				return callback(this.error_handler.error('repo_id_required'));
			}
			else if (!this.attributes.file) {
				return callback(this.error_handler.error('file_required'));
			}
			delete this.attributes.name;
			delete this.attributes.member_ids;
		}
		else if (this.attributes.type === 'direct') {
			delete this.attributes.file;
			delete this.attributes.repo_id;
			delete this.attributes.name;
		}
		process.nextTick(callback);
	}

	ensure_user_is_member () {
		if (this.attributes.type === 'file') {
			return; // not required for files
		}
		this.attributes.member_ids = this.attributes.member_ids || [this.user.id];
		if (!(this.attributes.member_ids instanceof Array)) {
			// this will get caught later
			return;
		}
		if (this.attributes.member_ids.indexOf(this.user.id) === -1) {
			this.attributes.member_ids.push(this.user.id);
		}
		this.attributes.member_ids.sort();
	}

	allow_attributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['team_id', 'repo_id', 'type', 'file', 'name'],
				'array(string)': ['member_ids']
			}
		);
		process.nextTick(callback);
	}

	check_existing_query () {
		let query = {
			team_id: this.attributes.team_id,
			type: this.attributes.type
		};
		if (this.attributes.type === 'channel') {
			query.name = this.attributes.name;
		}
		else if (this.attributes.type === 'direct') {
			query.member_ids = this.attributes.member_ids;
		}
		else if (this.attributes.type === 'file') {
			query.repo_id = this.attributes.repo_id;
			query.file = this.attributes.file;
		}
		return query;
	}

	model_can_exist () {
		return this.attributes.type !== 'channel';
	}

	pre_save (callback) {
		this.attributes.creator_id = this.user.id;
		super.pre_save(callback);
	}
}

module.exports = Stream_Creator;
