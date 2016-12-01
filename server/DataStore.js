var _ = require('lodash');


/**
 *
 * A single data store to manage a single Raincatcher Data Set.
 *
 * @param mediator      -  The application mediator
 * @param schema        -  The waterline schema for the data set.
 * @param mongoose
 * @param dataStoreId
 * @constructor
 */
function DataStore(mediator, schema, mongoose, dataStoreId) {
  this.mediator = mediator;
  this.subscriptions = {};
  this.schema = schema;
  this.mongoose = mongoose;
  this.id = dataStoreId;
}

/**
 * Initialising the mongoose model associated with this data store.
 */
DataStore.prototype.initialize = function() {
  this.model = this.mongoose.model(this.id, this.schema);
};

/**
 *
 * Registering a topic handler for the data store.
 *
 * @param topic           -  The raincatcher topic to handle
 * @param topicFunction   -  The implementation of the function
 */
DataStore.prototype.registerSubscriber = function(topic, topicFunction) {
  var self = this;
  self.subscriptions[topic] = self.mediator.subscribe(topic, function() {

    //Executing the function in the context of the data store with the passed arguments.
    //This allows registered functions to have access to the data store
    //TODO - shouldn't really do this in here.
    var dsFunction = _.bind(self, topicFunction, arguments);
    dsFunction().then(function(){
        self.mediator.publish('done:' + topic);
      })
      .reject(function(error) {
        self.mediator.publish('error:' + topic, error);
      });
  });
};


/**
 * Un-subscribing from all mediator topics related to this data store.
 */
DataStore.prototype.unsubscribe = function() {
  var self = this;

  _.each(self.subscriptions)
};

module.exports = DataStore;