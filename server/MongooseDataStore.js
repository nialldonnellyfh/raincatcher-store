var _ = require('lodash');


//A Mongoose Data Store
//TODO:  This should be a module (fh-wfm-storage-mongoose)

function WFMMongooseSchema(schemaId, schema) {
  this.id = schemaId;
  this.schema = schema;
}

/**
 * A single Mongoose model
 * @param mongoose
 */
WFMMongooseSchema.prototype.initialise = function(mongoose) {
  this.model = mongoose.model(this.id, this.schema);
};

/**
 *
 * A single data store to manage a single Raincatcher Data Set.
 *
 * @param mongoose
 * @constructor
 */
function MongooseDataStore(mongoose) {
  this.mongoose = mongoose;
  this.dataSets = {};
}

/**
 * Registering a schema for the mongoose storage.
 * @param options
 * @param options.dataSetId
 * @param options.schema
 */
MongooseDataStore.prototype.initDataSet = function (options) {
  var schemaId = options.dataSetId;
  this.dataSets[schemaId] = new WFMMongooseSchema(schemaId, options.schema);
  return schema;
};

/**
 * Getting a data set based on a Data Set ID.
 * @param dataSetId
 * @returns {*}
 */
MongooseDataStore.prototype.getDataSet = function(dataSetId) {
  return this.dataSets[dataSetId];
};

/**
 * Initialising the mongoose model
 */
MongooseDataStore.initialise = function() {
  var self = this;
  _.each(this.dataSets, function (schema){
    schema.initialise(self.mongoose);
  });
};


module.exports = MongooseDataStore;