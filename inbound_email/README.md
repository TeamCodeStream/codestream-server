This is the inbound email server. It handles email files deposited in a directory
by our mail server (Postfix), and digests them for use by CodeStream. It reads
and parses the mail files, does some processing, then sends them to the API server
using a special http call.
