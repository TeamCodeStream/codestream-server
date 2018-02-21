// handles updating the lastReads attribute for users in a team or stream,
// for a particular stream ... the lastReads attribute governs up to which
// post a particular user has read in a stream

'use strict';

class LastReadsUpdater {

	constructor (options) {
		Object.assign(this, options);
	}

	// update the lastReads attribute for each of the specified members
	// of a team or stream
	updateLastReads (callback) {
		// the current user is assumed to be "caught up" in a stream if they are
		// posting to that stream, so we don't update their lastReads when there
		// is a new post
		let memberIds = this.memberIdsWithoutCurrentUser();
		if (memberIds.length === 0) {
			return callback();
		}
		// look for any users who don't have a lastReads attribute set for the
		// stream in question ... if they do, we don't set it, since they are
		// already "not caught up" ... only users who are "caught up" get the
		// lastReads attribute set
		let lastReadsElem = 'lastReads.' + this.stream.id;
		let query = {
			_id: this.data.users.inQuerySafe(memberIds),
			[lastReadsElem]: { $exists: false }
		};
		let previousPostSeqNum = this.previousPostSeqNum || '0';
		let update = {
			$set: {
				[lastReadsElem]: previousPostSeqNum
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

	// get the members of the team or stream without the current user ...
	// since the current user (the one creating a post) is assumed to be
	// "caught up" for that stream, they should not have their lastReads updated
	memberIdsWithoutCurrentUser () {
		let memberIds = this.stream.get('type') === 'file' ?
			this.team.get('memberIds') :	// file-type streams go to the whole team
			this.stream.get('memberIds');	// other type streams have their own members
		memberIds = memberIds ? [...memberIds] : [];
		let userIdIndex = memberIds.indexOf(this.user.id);
		if (userIdIndex !== -1) {
			memberIds.splice(userIdIndex, 1);
		}
		return memberIds;
	}
}

module.exports = LastReadsUpdater;
