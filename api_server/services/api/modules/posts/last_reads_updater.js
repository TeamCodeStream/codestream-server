'use strict';

class Last_Reads_Updater {

	constructor (options) {
		Object.assign(this, options);
	}

	update_last_reads (callback) {
		let member_ids = this.member_ids_without_current_user();
		if (member_ids.length === 0) {
			return callback();
		}
		let last_reads_elem = 'last_reads.' + this.stream.id;
		let query = {
			_id: { $in: member_ids },
			[last_reads_elem]: { $exists: false }
		};
		let previous_post_id = this.previous_post_id || '0';
		let update = {
			$set: {
				[last_reads_elem]: previous_post_id
			}
		};
		this.data.users.update_direct(
			query,
			update,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Unable to update last reads for new post, stream_id=${this.stream.id}: ${JSON.stringify(error)}`);
				}
				callback();
			}
		);
	}

	member_ids_without_current_user () {
		let member_ids = this.stream.get('type') === 'file' ?
			this.team.get('member_ids') :
			this.stream.get('member_ids');
		member_ids = member_ids || [];
		let user_id_index = member_ids.indexOf(this.user.id);
		if (user_id_index !== -1) {
			member_ids.splice(user_id_index, 1);
		}
		member_ids = member_ids.map(member_id => this.data.users.object_id_safe(member_id));
		return member_ids;
	}
}

module.exports = Last_Reads_Updater;
