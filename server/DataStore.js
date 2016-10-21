var Waterline = require('waterline');
var q = require('q');
var _ = require('lodash');

function DataStore(mediator, schema, datasetId, topicPrefix, topicConfig) {
  this.mediator = mediator;
  this.topicPrefix = topicPrefix || "";
  this.datasetId = datasetId;
  this.topic = {};
  this.subscription = {};
  this.schema = schema;
  this.collection = Waterline.Collection.extend(schema);
  this.topicConfig = topicConfig;
}

DataStore.prototype.generateCustomTopics = function() {
  var self = this;


  _.each(this.topicConfig, function(topicFunc, topic) {
    self.mediator.subscribe(topic, function() {
      topicFunc(self.initialisedCollection).then(function(){
        self.mediator.publish('done:' + topic);
      });
    });
  });
};

/**
 * Registering subscribers for all CRUDL mediator topics.
 */
DataStore.prototype.registerSubscribers = function () {
  var self = this;
  var topicPrefix = this.topicPrefix;

  self.generateCustomTopics();

  self.topic.create = "wfm:" + topicPrefix + self.datasetId + ':create';
  console.log('Subscribing to mediator topic:', self.topic.create);
  self.subscription.create = self.mediator.subscribe(self.topic.create, function(object, ts) {
    ts = ts || Date.now();
    console.log("** Creating ", self.topic.create, object, ts);
    self.create(object, ts).then(function(object) {
      console.log("** Finish Creating ", self.topic.create, object, ts);
      self.mediator.publish('done:' + self.topic.create + ':' + ts, object);
    });
  });

  self.topic.load = "wfm:" + topicPrefix + self.datasetId + ':read';
  console.log('Subscribing to mediator topic:', self.topic.load);
  self.subscription.load = self.mediator.subscribe(self.topic.load, function(id) {
    self.read(id).then(function(object) {
      self.mediator.publish('done:' + self.topic.load + ':' + id, object);
    });
  });

  self.topic.save = "wfm:" + topicPrefix + self.datasetId + ':update';
  console.log('Subscribing to mediator topic:', self.topic.save);
  self.subscription.save = self.mediator.subscribe(self.topic.save, function(object) {
    self.update(object).then(function(object) {
      self.mediator.publish('done:' + self.topic.save + ':' + object.id, object);
    });
  });

  self.topic.delete = "wfm:" + topicPrefix + self.datasetId + ':delete';
  console.log('Subscribing to mediator topic:', self.topic.delete);
  self.subscription.delete = self.mediator.subscribe(self.topic.delete, function(object) {
    self.delete(object).then(function(object) {
      self.mediator.publish('done:' + self.topic.delete + ':' + object.id, object);
    });
  });

  self.topic.list = "wfm:" + topicPrefix + self.datasetId + ':list';
  console.log('Subscribing to mediator topic:', self.topic.list);
  self.subscription.list = self.mediator.subscribe(self.topic.list, function(queryParams) {
    var filter = queryParams && queryParams.filter || {};
    self.list(filter).then(function(list) {
      self.mediator.publish('done:' + self.topic.list, list);
    });
  });
};

DataStore.prototype.setInitialisedCollection = function(initialisedCollection) {
  this.initialisedCollection = initialisedCollection;
};

DataStore.prototype.create = function(dataToCreate) {
  return this.initialisedCollection.create(dataToCreate);
};

DataStore.prototype.update = function(dataToUpdate) {
  return this.initialisedCollection.update(dataToUpdate.id, dataToUpdate);
};

DataStore.prototype.list = function() {
  return this.initialisedCollection.find();
};

DataStore.prototype.delete = function(objectToDelete) {
  return this.initialisedCollection.destroy(objectToDelete.id);
};

DataStore.prototype.read = function(id) {
  return this.initialisedCollection.findOne(id);
};

/**
 * Un-subscribing from all mediator topics related to this mongo data store.
 */
DataStore.prototype.unsubscribe = function() {
  this.mediator.remove(this.topic.list, this.subscription.list.id);
  this.mediator.remove(this.topic.load, this.subscription.load.id);
  this.mediator.remove(this.topic.save, this.subscription.save.id);
  this.mediator.remove(this.topic.create, this.subscription.create.id);
  this.mediator.remove(this.topic.delete, this.subscription.delete.id);
};

module.exports = DataStore;