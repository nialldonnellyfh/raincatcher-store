function TopicBuilder(storeId, raincatcherStore) {
  this.storeId = storeId;
  this.raincatcherStore = raincatcherStore;
  this.prefix = '';
}

TopicBuilder.prototype.prefix = function(prefix) {
  this.prefix = prefix;
};

TopicBuilder.prototype.entity = function(entityId) {
  this.entityId = entityId;
};

/**
 *
 * Creating a subscriber for the top
 *
 * @param topic
 * @param topicFn
 */
TopicBuilder.prototype.subscribe = function(topic, topicFn) {
  var fullTopic = this.prefix + ":" + this.entityId + ":" + topic;

  this.raincatcherStore.registerTopic(this.storeId, this.entityId, fullTopic, topicFn);
};


module.exports = TopicBuilder;