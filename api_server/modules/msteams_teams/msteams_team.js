// provides the MSTeamsTeam model for handling MS Teams teams

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model'); 

class MSTeamsTeam extends CodeStreamModel {}

module.exports = MSTeamsTeam;
