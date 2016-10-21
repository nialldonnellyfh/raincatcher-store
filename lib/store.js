const Waterline = require('waterline');
const _ = require('lodash');

const waterline = new Waterline();
const collections = {};

const Store = function(mediator, collection) {
  this.mediator = mediator;

  // grab initialized collection
  this.collectionName = collection.toLowerCase();
  this.collection = collections[this.collectionName];
  if (this.collection) {
    throw new Error('collection ' + collection + ' should have been initialized!');
  }

  // setup delegation of methods to waterline collection
  this.create = this.collection.create.bind(collection);
  this.find = this.collection.find.bind(collection);
  this.findOne = this.collection.findOne.bind(collection);
  this.findOrCreate = this.collection.findOrCreate.bind(collection);
  this.update = this.collection.update.bind(collection);
  this.destroy = this.collection.destroy.bind(collection);
  this.delete = this.destroy;

  this.read = function(id) {
    return this.collection.findOne(id);
  };

  this.topics = {};
  this.subscriptions = {};
};


// class-level methods
Store.prototype.model = function(name, config) {
  // waterline model identity must be lowercase
  var identity = name.toLowerCase();
  _.defaults(config, {
    identity: identity,
    connection: 'default'
  });
  var coll = Waterline.Collection.extend(config);
  waterline.loadCollection(coll);
  return coll;
};

Store.prototype.init = function(conf, cb) {
  waterline.initialize(this.config, function(err, ontology) {
    if (err) {
      return cb(err);
    }

    // assign initialized collections to Store
    _.defaults(collections, ontology.collections);

    cb();
  });
};

// # Instance methods
Store.prototype.listen = function(topicPrefix) {
  var self = this;
  var mediator = this.mediator;
  self.topics.create = "wfm:" + topicPrefix + self.datasetId + ':create';
  console.log('Subscribing to mediator topic:', self.topics.create);
  self.subscriptions.create = mediator.subscribe(self.topics.create, function(object, ts) {
    self.create(object, ts).then(function(object) {
      mediator.publish('done:' + self.topics.create + ':' + ts, object);
    });
  });

  self.topics.load = "wfm:" + topicPrefix + self.datasetId + ':read';
  console.log('Subscribing to mediator topic:', self.topics.load);
  self.subscriptions.load = mediator.subscribe(self.topics.load, function(id) {
    self.read(id).then(function(object) {
      mediator.publish('done:' + self.topics.load + ':' + id, object);
    });
  });

  self.topics.save = "wfm:" + topicPrefix + self.datasetId + ':update';
  console.log('Subscribing to mediator topic:', self.topics.save);
  self.subscriptions.save = mediator.subscribe(self.topics.save, function(object) {
    self.update(object).then(function(object) {
      mediator.publish('done:' + self.topics.save + ':' + object.id, object);
    });
  });

  self.topics.delete = "wfm:" + topicPrefix + self.datasetId + ':delete';
  console.log('Subscribing to mediator topic:', self.topics.delete);
  self.subscriptions.delete = mediator.subscribe(self.topics.delete, function(object) {
    self.delete(object).then(function(object) {
      mediator.publish('done:' + self.topics.delete + ':' + object.id, object);
    });
  });

  self.topics.list = "wfm:" + topicPrefix + self.datasetId + ':list';
  console.log('Subscribing to mediator topic:', self.topics.list);
  self.subscriptions.list = mediator.subscribe(self.topics.list, function(queryParams) {
    var filter = queryParams && queryParams.filter || {};
    self.list(filter).then(function(list) {
      mediator.publish('done:' + self.topics.list, list);
    });
  });
};


Store.prototype.unsubscribe = function() {
  this.mediator.remove(this.topics.list, this.subscriptions.list.id);
  this.mediator.remove(this.topics.load, this.subscriptions.load.id);
  this.mediator.remove(this.topics.save, this.subscriptions.save.id);
  this.mediator.remove(this.topics.create, this.subscriptions.create.id);
  this.mediator.remove(this.topics.delete, this.subscriptions.delete.id);
};

module.exports = Store;