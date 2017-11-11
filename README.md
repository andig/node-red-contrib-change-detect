# node-red-contrib-change-detect
[![NPM Version](https://img.shields.io/npm/v/node-red-contrib-change-detect.svg)](https://www.npmjs.com/package/node-red-contrib-change-detect)
[![Build status](https://travis-ci.org/andig/node-red-contrib-change-detect.svg?branch=master)](https://travis-ci.org/andig/node-red-contrib-change-detect)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=NSKDAYZFH8H8J)

A change detection node for [Node-RED](https://nodered.org)

## Usage

Change detecting works by keeping track of

  - when the last message was processed (typically `Date.now()`) and
  - what the value of the last message was (typically `msg.payload`)

By keeping track of timestamp and value by identifier (typically `msg.topic`) the node is able to determine if a message timestamp or value has changed enough according to the criteria defined.

Individual change detection nodes- if more than one is used- are independent. Each node builds its own cache of message identifiers and time/value history. Note that this map will continue to grow with each new identifier found.

Message that fulfill the change detection criteria are forwarded to the `pass` output, all other messages are forwarded on the `skip` output.

To use this node configure the following settings.

### Minimum Time Delta

`minTimeDelta` specifies the minimum time resolution in milliseconds. If another message of the same identifier arrives within `minTimeDelta` it will be removed.

### Minimum Value Delta

`minValueDelta` specifies the minimum value resolution. If another message of the same identifier arrives that is not different from the previous message by at least `minValueDelta` it will be removed.

### Maximum Time Delta

`maxTimeDelta` can be used to ensure that once in a while a message is passed even if it's value did not change. Specifying `maxTimeDelta` is only helpful if matching mode is `AND`.

### Mode

Conditions matching mode indicates under what condition messages are allowed to *pass*:

  - **OR**: messages pass if either the `minValueDelta` or `minTimeDelta` conditions are true. This is the default.
  - **AND**: messages only pass if both the `minValueDelta` and `minTimeDelta` conditions are true
