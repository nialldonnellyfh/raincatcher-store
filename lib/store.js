var Waterline = require('waterline');
var memoryStore = require('sails-memory');
var _ = require('lodash');

const Store = function(mediator, config) {
  // add the memory adapter as a fallback default
  _.defaultsDeep(config, {
    adapters: {
      'memory': memoryStore
    },
    connections: {
      default: {
        adapter: 'memory'
      }
    }
  });

  this.config = config;
};

Store.prototype.collection = function(name, config) {
  // waterline model identity must be lowercase
  var identity = name.toLowerCase();
  _.defaults(config, {
    identity: identity,
    connection: 'default'
  });
  return Waterline.Collection.extend(config);
};

Store.prototype.init = function(cb) {
  this.orm = new Waterline();
  var self = this;
  this.orm.initialize(this.config, function(err, ontology) {
    if (err) {
      return cb(err);
    }

    // assign initialized collections to Store
    _.defaults(self, ontology.collections);

    cb();
  });
};