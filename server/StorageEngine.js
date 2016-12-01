var DataStore = require('./DataStore');
var _ = require('lodash');


/**
 * A Raincatcher Storage Engine.
 *
 * This engine is designed to manage the various data stores used by applications that consume raincatcher modules.
 *
 * @param mediator
 * @param mongoose
 * @constructor
 */
function StorageEngine(mediator, mongoose) {
  var self = this;
  self.mediator = mediator;
  self.dataStores = {};
  self.mongoose = mongoose;

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
 * @param {object} schema         - The waterline schema.
 * @param {string}  dataStoreId   - The ID of the data store.
 * @returns {DataStore}
 */
StorageEngine.prototype.addDataStore = function (schema, dataStoreId) {
  console.log("Adding Data Store");
  var self = this;
  var dataStore = new DataStore(self.mediator, schema, self.mongoose, dataStoreId);

  //Registering the data store.
  //TODO - Should check for duplicates etc.
  self.dataStores[dataStoreId] = dataStore;

  return dataStore;
};

StorageEngine.prototype.initialise = function() {
  var self = this;
  console.log("Initialising StorageEngine");

  _.each(self.dataStores, function(dataStore) {
    dataStore.initialise();
  });
};


StorageEngine.prototype.unsubscribeDataStoreSubscribers = function () {
  _.each(this.dataStores, function (dataSet) {
    dataSet.unsubscribe();
  });
};

module.exports = StorageEngine;