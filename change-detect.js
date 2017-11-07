module.exports = function(RED) {
    function ChangeDetectNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        node.config = config;

        node.on('input', function(msg) {
            var minDelta = node.getConfig('minDelta');
            var minTime = node.getConfig('minTime');
            var maxTime = node.getConfig('maxTime');

            var mode = node.config.changeDetectionMode || 'OR';
            var timestampPath = node.config.timestampPath;
            var valuePath = node.config.valuePath || 'payload';
            var identifierPath = node.config.identifierPath || 'topic';

            // get timestamp & identifier
            node.timestamp = 0 + node.getFromMessage(msg, timestampPath, Date.now());
            node.value = 0 + node.getFromMessage(msg, valuePath);
            node.identifier = node.getFromMessage(msg, identifierPath);

            // check if msg identifier found
            if (node.identifier === undefined || node.identifier === "") {
                node.status({
                    fill: "red",
                    shape: "circle",
                    text: "missing identifier"
                });
                node.send(msg);
                return;
            }
            else {
                node.status({});
            }

            var state = node.context().get('_delta_' + node.identifier);
            var reject = false;

            if (state) {
                var delta;

                if (maxTime !== undefined || minTime !== undefined) {
                    delta = node.timestamp - state.timestamp;

                    if (delta >= maxTime) {
                        // maxTime condition elapsed -> pass
                        node.resolve(msg);
                        return;
                    }

                    if (delta < minTime) {
                        // minTime condition violated -> skip
                        // in OR mode decision can be made here if minDelta is not defined
                        if (mode == 'AND' || minDelta === undefined) {
                            node.reject(msg);
                            return;
                        }
                    }
                }

                // @todo check timestamp state updates
                if (minDelta !== undefined) {
                    delta = Math.abs(node.value - state.value);

                    if (delta < minDelta) {
                        // value condition violated -> reject
                        node.reject(msg);
                        return;
                    }
                }
            }

            // update state and send
            node.resolve(msg);
        });

        node.on('close', function() {
            // tidy up any state
        });

        /**
         * Update state and return msg
         */
        node.getConfig = function(attribute) {
            var value = node.config[attribute];
            if (value === '') {
                value = undefined;
            }
            return value;
        };

        /**
         * Update state and return msg
         */
        node.resolve = function(msg) {
            node.context().set('_delta_' + node.identifier, {
                timestamp: node.timestamp,
                value: node.value
            });
            node.send(msg);
        };

        /**
         * Swallow msg
         */
        node.reject = function(msg) {
            node.send([null, msg]);
        };

        /**
         * Get value from msg by path definition
         */
        node.getFromMessage = function(msg, path, defaultValue) {
            if (path === undefined) {
                if (defaultValue === undefined) {
                    node.error('Value path and default value undefined');
                    return undefined;
                }
                return defaultValue;
            }

            var value, components = path.split('.');

            // remove leading msg.
            if (components.length && components[0] === 'msg') {
                components.shift();
            }

            value = msg;
            while (components.length) {
                var component = components.shift();
                if (value[component] === undefined) {
                    node.error('Value path undefined');
                    return undefined;
                }
                value = value[component];
            }

            return value;
        };
    }

    RED.nodes.registerType('delta', ChangeDetectNode);
};
