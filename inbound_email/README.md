This is the inbound email server. It handles email files deposited in a directory
by our mail server (Postfix), and digests them for use by CodeStream. It reads
and parses the mail files, does some processing, then sends them to the API server
using a special http call.

To use the inbound email server, you'll need the following environment variables set:

CS_INBOUND_EMAIL_SRCTOP - top of the source directory
CS_INBOUND_EMAIL_DIRECTORY - new email files will appear in this directory
CS_INBOUND_EMAIL_PROCESS_DIRECTORY - email files will be moved to this directory for processing
CS_INBOUND_EMAIL_TEMP_ATTACHMENT_DIRECTORY - attachments in incoming emails will be stored temporarily here
CS_INBOUND_EMAIL_REPLY_TO_DOMAIN - domain we use in the reply-to field of outbound emails_sent
CS_INBOUND_EMAIL_SENDER_EMAIL - address we send outbound emails from
CS_INBOUND_EMAIL_LOG_DIRECTORY - directory where log files will be stored
CS_INBOUND_EMAIL_LOG_CONSOLE_OK (optional) - output to console when running inbound email server, for dev purposes
CS_INBOUND_EMAIL_SECRET - secret code needed to communicate with API server
CS_INBOUND_EMAIL_API_HOST - host of the API server
CS_INBOUND_EMAIL_API_PORT - port of the API server
