'use strict';

class LastReadsUpdater {

	constructor (options) {
		Object.assign(this, options);
	}

	updateLastReads (callback) {
		let memberIds = this.memberIdsWithoutCurrentUser();
		if (memberIds.length === 0) {
			return callback();
		}
		let lastReadsElem = 'lastReads.' + this.stream.id;
		let query = {
			_id: { $in: memberIds },
			[lastReadsElem]: { $exists: false }
		};
		let previousPostId = this.previousPostId || '0';
		let update = {
			$set: {
				[lastReadsElem]: previousPostId
			}
		};
		this.data.users.updateDirect(
			query,
			update,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Unable to update last reads for new post, streamId=${this.stream.id}: ${JSON.stringify(error)}`);
				}
				callback();
			}
		);
	}

	memberIdsWithoutCurrentUser () {
		let memberIds = this.stream.get('type') === 'file' ?
			this.team.get('memberIds') :
			this.stream.get('memberIds');
		memberIds = memberIds || [];
		let userIdIndex = memberIds.indexOf(this.user.id);
		if (userIdIndex !== -1) {
			memberIds.splice(userIdIndex, 1);
		}
		memberIds = memberIds.map(memberId => this.data.users.objectIdSafe(memberId));
		return memberIds;
	}
}

module.exports = LastReadsUpdater;
