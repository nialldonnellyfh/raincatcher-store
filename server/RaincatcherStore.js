var _ = require('lodash');
var TopicBuilder = require('./TopicBuilder');



/**
 * A Raincatcher Storage Engine.
 *
 * This engine is designed to manage the various data stores used by applications that consume raincatcher modules.
 *
 * @param mediator
 * @constructor
 */
function RaincatcherStore(mediator) {
  var self = this;
  self.mediator = mediator;
  self.dataStores = {};
  self.stores = {};
  self.subscribers = {};

  //Listening for storage initialisation topic
  self.mediator.once('wfm:storage:initialise', function () {
    self.initialise();
  });
}

/**
 * Registering a subscriber for a single topic.
 * @param storeId
 * @param entityId
 * @param topic
 * @param topicFn
 */
RaincatcherStore.prototype.registerTopic = function(storeId, entityId, topic, topicFn) {
  var self = this;

  //Binding the topic function to the store
  //Custom functions should be executed in the context of the entity
  var store = self.stores[storeId];
  var entity = store.getEntity(entityId);
  //Allowing the mediator to be assigned to the entity for
  var subscriberFunction = _.bind(topicFn, _.defaults(entity, {mediator: self.mediator}));

  this.subscribers[topic] = self.mediator.subscribe(topic, subscriberFunction);
};

/**
 *
 * Utility function to register topics for a specific data store.
 *
 * @param storeId
 * @returns {TopicBuilder}
 */
RaincatcherStore.prototype.withStore = function(storeId) {
  return new TopicBuilder(storeId, this);
};


/**
 *
 * Adding a data store to the engine.
 *
 *
 * @param {object}  entityStore
 * @param {string}  entityStoreId
 */
RaincatcherStore.prototype.addEntityStore = function (entityStoreId, entityStore) {
  console.log("Adding Data Store");
  var self = this;

  self.stores[entityStoreId] = entityStore;
};


/**
 * Initialising the raincatcher storage, this will call initialise on the registered data stores.
 */
RaincatcherStore.prototype.initialise = function() {
  var self = this;

  //Initialising each of the registered data stores
  _.each(self.dataStores, function(dataStore) {
    dataStore.initialise();
  });
};

module.exports = RaincatcherStore;