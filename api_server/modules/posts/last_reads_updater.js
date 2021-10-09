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
	async updateLastReads () {
		// the current user is assumed to be "caught up" in a stream if they are
		// posting to that stream, so we don't update their lastReads when there
		// is a new post
		const memberIds = this.memberIdsWithoutCurrentUser();
		if (memberIds.length === 0) {
			return;
		}

		// look for any users who don't have a lastReads attribute set for the
		// stream in question ... if they do, we don't set it, since they are
		// already "not caught up" ... only users who are "caught up" get the
		// lastReads attribute set
		// we also update lastEmailsSent for this stream, since the user is seeing
		// new messages for the first time, we can assume they have been sent 
		// whatever emails were going to be sent for this stream
		const lastReadsElem = 'lastReads.' + this.stream.id;
		const lastEmailsSentElem = 'lastEmailsSent.' + this.stream.id;
		const query = {
			id: this.data.users.inQuerySafe(memberIds),
			[lastReadsElem]: { $exists: false }
		};
		const previousPostSeqNum = this.previousPostSeqNum || 0;
		const update = {
			$set: {
				[lastReadsElem]: previousPostSeqNum
			},
			$unset: {
				[lastEmailsSentElem]: true
			}
		};
		try {
			await this.data.users.updateDirectWhenPersist(query, update);
		}
		catch (error) {
			if (this.logger) {
				this.logger.warn(`Unable to update last reads for new post, streamId=${this.stream.id}: ${JSON.stringify(error)}`);
			}
		}
	}

	// get the members of the team or stream without the current user ...
	// since the current user (the one creating a post) is assumed to be
	// "caught up" for that stream, they should not have their lastReads updated
	memberIdsWithoutCurrentUser () {
		let memberIds;
		const type = this.stream.get('type');
		if (type === 'file' || this.stream.get('isTeamStream')) {
			// file-type streams - or team-streams - go to the whole team
			memberIds = this.team.get('memberIds');
		} else {
			// otherwise we go to the members of the stream
			memberIds = this.stream.get('memberIds');
		}
		memberIds = memberIds ? [...memberIds] : [];
		const userIdIndex = memberIds.indexOf(this.user.id);
		if (userIdIndex !== -1) {
			memberIds.splice(userIdIndex, 1);
		}
		return memberIds;
	}
}

module.exports = LastReadsUpdater;
