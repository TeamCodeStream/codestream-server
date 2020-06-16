// provides the MSTeamsTeam model for handling MS Teams state

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model'); 

class MSTeamsState extends CodeStreamModel {}

module.exports = MSTeamsState;
