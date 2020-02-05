// provides the msteams_conversation model for handling msteams_conversations

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model'); 

class MSTeamsConversation extends CodeStreamModel {}

module.exports = MSTeamsConversation;
