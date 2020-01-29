// provides the User model for handling users

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model'); 

class MSTeamsConversation extends CodeStreamModel {}

module.exports = MSTeamsConversation;
