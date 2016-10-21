var DataStore = require('./DataStore');
var Waterline = require('waterline');
var _ = require('lodash');

function StorageEngine(mediator) {
  var self = this;
  this.mediator = mediator;
  this.dataSets = {};
  //Storage is initialised, we can use.
  //TODO, This could be nicer..
  this.mediator.once('wfm:storage:initialise', function(config) {
    console.log("Initialising Storage");
    self.initialise(config);
  });

  //When the application closes, we close the subscribers.
  this.mediator.once('wfm:application:close', function() {
    self.unsubscribeDataSetSubscribers();
  });
}

StorageEngine.prototype.addDataSet = function (schema, datasetId, topicPrefix, topicConfig) {
  console.log("Adding Data Set");
  var dataSet = new DataStore(this.mediator, schema, datasetId, topicPrefix, topicConfig);

  //Storing the data sets.
  this.dataSets[datasetId] = dataSet;
};

StorageEngine.prototype.initialise = function(config) {
  var self = this;
  console.log("Initialising StorageEngine");
  this.waterline = new Waterline();

  //Loading Collections
  _.each(this.dataSets, function(dataSet) {
    self.waterline.loadCollection(dataSet.collection);
  });

  console.log("Initialising Waterline");
  this.waterline.initialize(config, function(err, ontology) {
    console.log("Waterline initialised", err, ontology);
    if(err) {
      self.mediator.publish('error:storage:initialise', err);
    } else {
      _.each(self.dataSets, function (dataSet) {
        //Storage is ready, set the collection
        var dataSetCollection = _.find(ontology.collections, function(initialisedCollection, name) {
          console.log("**** collections", name, dataSet.schema.identity, initialisedCollection);
          return name === dataSet.schema.identity;
        });

        console.log("*** dataSetCollection", dataSetCollection);

        dataSet.setInitialisedCollection(dataSetCollection);
      });

      self.registerDataSetSubscribers();
      //Finished storage initialsation.
      self.mediator.publish('done:wfm:storage:initialise');
    }

  });
};


StorageEngine.prototype.registerDataSetSubscribers = function( ) {
  _.each(this.dataSets, function (dataSet) {
    dataSet.registerSubscribers();
  });
};

StorageEngine.prototype.unsubscribeDataSetSubscribers = function () {
  _.each(this.dataSets, function (dataSet) {
    dataSet.unsubscribe();
  });
};

module.exports = StorageEngine;