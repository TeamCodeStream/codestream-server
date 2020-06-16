'use strict';

const MessageTest = require('./message_test');
const DeleteMarkerTest = require('./delete_marker_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class MarkerToTeamMessageTest extends Aggregation(MessageTest, DeleteMarkerTest) {

	constructor (options) {
		super(options);
		this.wantMarker = true;
	}

	get description () {
		const type = this.streamType === 'team stream' ? 'team' : this.streamType;
		return `members of the team should receive a message with the deactivated marker when a codemark with markers is deleted in a ${type} stream`;
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// postless markers always come in on the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	deleteCodemark (callback) {
		super.deleteCodemark(error => {
			if (error) { return callback(error); }
			if (this.streamType !== 'team stream') {
				// for streams, the message received on the team channel should be limited to the markers 
				this.message = {
					markers: this.message.markers
				};
			}
			callback();
		});
	}
}

module.exports = MarkerToTeamMessageTest;
