var _ = require('lodash');


//A Mongoose Data Store
//TODO:  This should be a module (fh-wfm-storage-mongoose)

function WFMMongooseModel(schemaId, schema) {
  this.id = schemaId;
  this.schema = schema;
}

WFMMongooseModel.prototype.initialise = function(mongoose) {
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
  this.schemas = {};
}

/**
 * Registering a schema for the mongoose storage.
 * @param schemaId
 * @param schema
 */
MongooseDataStore.prototype.registerSchema = function (schemaId, schema) {
  this.schemas[schemaId] = schema;
};

/**
 * Initialising the mongoose model
 */
MongooseDataStore.initialise = function() {
  var self = this;
  _.each(this.schemas, function (schema){
    schema.initialise(self.mongoose);
  });
};


module.exports = MongooseDataStore;