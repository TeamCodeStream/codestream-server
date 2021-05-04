# Broadcaster Build Information

TeamCity Project: [Broadcaster](https://redirector.codestream.us/builds/broadcaster)

## GitFlow and Brief Overview
Read the [Build Overview](https://redirector.codestream.us/ops/workflows) page on the Ops Wiki site.
## Assets

| Type | Desc |
| --- | --- |
| info | asset info file |
| tgz | tarball of repo following an **npm install** for x86_64 |
| docker image | docker images are only stored in dockerhub repos |

| Asset Env | Asset | Branch | Location |
| --- | --- | --- | --- |
| dev | tgz | develop | [Asset server (dev/broadcaster)](http://assets.codestream.us/artifacts/dev/broadcaster/) |
| prod | tgz | master | [Asset server (prod/broadcaster)](http://assets.codestream.us/artifacts/prod/broadcaster/) |
| dev | docker image | develop | Published to docker hub as [teamcodestream/broadcaster-onprem-dev](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/broadcaster-onprem-dev) |
| prod | docker image | master | Published to docker hub as [teamcodestream/broadcaster-onprem](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/broadcaster-onprem) |

## Build Documentation

[TeamCity build documentation](https://github.com/TeamCodeStream/teamcity_tools/tree/master/docs)
