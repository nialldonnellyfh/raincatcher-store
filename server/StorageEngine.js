var DataStore = require('./DataStore');
var _ = require('lodash');


/**
 * A Raincatcher Storage Engine.
 *
 * This engine is designed to manage the various data stores used by applications that consume raincatcher modules.
 *
 * @param mediator
 * @constructor
 */
function StorageEngine(mediator) {
  var self = this;
  self.mediator = mediator;
  self.dataStores = {};

  //Listening for storage initialisation topic
  self.mediator.once('wfm:storage:initialise', function (config) {
    console.log("Initialising Storage");
    self.initialise(config);
  });

  //When the application closes, we close the subscribers for each data store.
  self.mediator.once('wfm:storage:close', function () {
    self.unsubscribeDataStoreSubscribers();
  });

}

/**
 *
 * Adding a data store to the engine.
 *
 *
 * @param {DataStore}  dataStore
 * @param {string}  dataStoreId
 * @returns {DataStore}
 */
StorageEngine.prototype.addDataStore = function (dataStoreId, dataStore) {
  console.log("Adding Data Store");
  var self = this;

  //Registering the data store.
  //TODO - Should check for duplicates etc.
  self.dataStores[dataStoreId] = {
    store: dataStore,
    topics: {}
  };

  return dataStore;
};

StorageEngine.prototype.initialise = function() {
  var self = this;
  console.log("Initialising StorageEngine");

  _.each(self.dataStores, function(dataStore) {
    dataStore.initialise();
  });
};

/**
 * Registering a schema for a single data store.
 * @param dataStoreId
 * @param options
 */
StorageEngine.prototype.initDataSet = function(dataStoreId, options) {
  return this.dataStores[dataStoreId].store.initDataSet(options);
};


/**
 *
 * Registering a subscriber for a topic related to a single data store.
 *
 * @param dataStoreId
 * @param dataSetId
 * @param topic
 * @param topicFunction
 */
StorageEngine.registerSubscriber = function(dataStoreId, dataSetId, topic, topicFunction) {
  var self = this;

  var dataStore = self.dataStores[dataStoreId];

  //TODO - shouldn't really create the function in here.
  function subscriberFunction() {

    //Executing the function in the context of the data set with the passed arguments.
    //This allows registered functions to have access to the data store
    //TODO: Be more guarded etc.
    var dataSet = dataStore.store.getDataSet(dataSetId);
    var dataSetFunction = _.bind(dataSet, topicFunction, arguments);
    dataSetFunction().then(function(){
        //Done, publish done state for this topic
        self.mediator.publish('done:' + topic);
      })
      .catch(function(error) {
        //Error fulfilling the topic, publish error state for this topic
        self.mediator.publish('error:' + topic, error);
      });
  }

  if(dataStore) {
    dataStore.topics[topic] = self.mediator.subscribe(topic, subscriberFunction);
  }
};

/**
 *
 * Un-subscribing the data store subscribers from the mediator.
 *
 * TODO: Can be more granular to unsubscribe specific topics in a speific data store.
 */
StorageEngine.prototype.unsubscribeDataStoreSubscribers = function () {
  var self = this;

  _.each(this.dataStores, function (dataStore) {
    _.each(dataStore.topics, function(subscription, topic) {
      self.mediator.remove(topic, subscription.id);
    });
  });
};

module.exports = StorageEngine;