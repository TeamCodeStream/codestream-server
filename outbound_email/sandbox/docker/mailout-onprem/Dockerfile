
FROM node:16.13.2

# This directory will be mounted from the host OS
RUN mkdir /opt/config

WORKDIR /opt/mailout
RUN mkdir log tmp pid

WORKDIR /opt/mailout/codestream-server

ADD outbound_email/src /opt/mailout/codestream-server/outbound_email/src
ADD outbound_email/package.json outbound_email/package-lock.json /opt/mailout/codestream-server/outbound_email/
ADD outbound_email/bin/outbound_email_server.js /opt/mailout/codestream-server/outbound_email/bin/outbound_email_server.js
ADD shared /opt/mailout/codestream-server/shared

WORKDIR /opt/mailout/codestream-server/outbound_email
RUN npm install --no-save

ENV CSSVC_BACKEND_ROOT=/opt/mailout/codestream-server
ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json
ENV NODE_PATH=/opt/mailout/codestream-server/outbound_email/node_modules
ENV CS_OUTBOUND_EMAIL_TOP=/opt/mailout/codestream-server/outbound_email
ENV CS_OUTBOUND_EMAIL_LOGS=/opt/mailout/log
ENV CS_OUTBOUND_EMAIL_TMP=/opt/mailout/tmp

CMD [ "/opt/mailout/codestream-server/outbound_email/bin/outbound_email_server.js" ]
