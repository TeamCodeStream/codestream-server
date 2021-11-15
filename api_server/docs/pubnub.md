# Pubnub Broadcast Service Integration

CodeStream production uses the [Pubnub](https://pubnub.com) service for
real-time broadcast messaging.

Ideally, each CodeStream environment should use its own set of pubnub keys to
guard against any cross-contamination but this is not absolutely required.

When generating a new keyset, apply the following configuration settings to it.

* Storage & Playback: On
    - Retention: 30 day
    - leave all other fields blank

* Access Manager: On

Leave all other configuration sections Off.
