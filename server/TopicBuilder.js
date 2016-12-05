/**
 *
 * A raincatcher topic builder for registering topics for storage topics.
 * @param storeId
 * @param raincatcherStore
 * @constructor
 */
function TopicBuilder(storeId, raincatcherStore) {
  this.storeId = storeId;
  this.raincatcherStore = raincatcherStore;
  this.prefix = '';
}

/**
 * Specifying a prefix for this topic generator.
 * @param prefix
 */
TopicBuilder.prototype.prefix = function(prefix) {
  this.prefix = prefix;
};

/**
 * Specifying an entity for this topic generator
 * @param entityId
 */
TopicBuilder.prototype.entity = function(entityId) {
  this.entityId = entityId;
};

/**
 *
 * Creating a subscriber for the topic in the raincatcher store.
 *
 * @param topic
 * @param topicFn
 */
TopicBuilder.prototype.subscribe = function(topic, topicFn) {
  var fullTopic = this.prefix + ":" + this.entityId + ":" + topic;

  this.raincatcherStore.registerTopic(this.storeId, this.entityId, fullTopic, topicFn);
};


module.exports = TopicBuilder;