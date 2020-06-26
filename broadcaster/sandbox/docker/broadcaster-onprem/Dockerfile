
FROM node:12.14.1

# This directory will be mounted from the host OS
RUN mkdir /opt/config

WORKDIR /opt/broadcaster
RUN mkdir log tmp pid

WORKDIR /opt/broadcaster/broadcaster

ADD broadcaster/*.js broadcaster/*.json broadcaster/*.info /opt/broadcaster/codestream-server/broadcaster/
ADD broadcaster/lib /opt/broadcaster/codestream-server/broadcaster/lib
ADD shared /opt/broadcaster/codestream-server/shared
ADD broadcaster/bin/broadcaster.js /opt/broadcaster/codestream-server/broadcaster/bin/broadcaster.js

RUN npm install --no-save

EXPOSE 12443

ENV CS_BROADCASTER_TOP=/opt/broadcaster/codestream-server/broadcaster
ENV CSSVC_BACKEND_ROOT=/opt/broadcaster/codestream-server
ENV CSSVC_CFG_FILE=/opt/config/codestream-services-config.json
ENV NODE_PATH=/opt/broadcaster/codestream-server/broadcaster/node_modules

CMD [ "/opt/broadcaster/broadcaster/bin/broadcaster.js" ]
