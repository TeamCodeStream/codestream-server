
FROM node:12.14.1

# This directory will be mounted from the host OS
RUN mkdir /opt/config

WORKDIR /opt/mailout
RUN mkdir log tmp pid

WORKDIR /opt/mailout/outbound_email

ADD src /opt/mailout/outbound_email/src
ADD package.json package-lock.json /opt/mailout/outbound_email/
ADD bin/outbound_email_server.js /opt/mailout/outbound_email/bin/outbound_email_server.js

RUN npm install --no-save

ENV CS_OUTBOUND_EMAIL_TOP=/opt/mailout/outbound_email
ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json
# ENV CS_OUTBOUND_EMAIL_SHOW_CFG=1

CMD [ "/opt/mailout/outbound_email/bin/outbound_email_server.js" ]
