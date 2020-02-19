
FROM node:12.14.1

# This directory will be mounted from the host OS
RUN mkdir /opt/config

WORKDIR /opt/broadcaster
RUN mkdir log tmp pid

WORKDIR /opt/broadcaster/broadcaster

ADD *.js *.json *.info /opt/broadcaster/broadcaster/
ADD lib /opt/broadcaster/broadcaster/lib
ADD server_utils /opt/broadcaster/broadcaster/server_utils
ADD codestream-configs /opt/broadcaster/broadcaster/codestream-configs
ADD bin/broadcaster.js /opt/broadcaster/broadcaster/bin/broadcaster.js

RUN npm install --no-save

EXPOSE 12443

ENV CS_BROADCASTER_TOP=/opt/broadcaster/broadcaster
ENV CS_BROADCASTER_CFG_FILE=/opt/config/codestream-services-config.json
# ENV CS_BROADCASTER_SHOW_CFG=1

CMD [ "/opt/broadcaster/broadcaster/bin/broadcaster.js" ]
