
FROM node:12.14.1

# This directory will be mounted from the host OS
RUN mkdir /opt/config

WORKDIR /opt/mailout
RUN mkdir log tmp pid

WORKDIR /opt/mailout/codestream-server/outbound_email

ADD outbound_email/src /opt/mailout/codestream-server/outbound_email/src
ADD outbound_email/package.json outbound_email/package-lock.json /opt/mailout/codestream-server/outbound_email/
ADD outbound_email/bin/outbound_email_server.js /opt/mailout/codestream-server/outbound_email/bin/outbound_email_server.js

RUN npm install --no-save

ENV CS_OUTBOUND_EMAIL_TOP=/opt/mailout/outbound_email
ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json
ENV CSSVC_BACKEND_ROOT=/opt/mailout/codestream-server
ENV NODE_PATH=/opt/mailout/codestream-server/outbound_email/node_modules

CMD [ "/opt/mailout/outbound_email/bin/outbound_email_server.js" ]
