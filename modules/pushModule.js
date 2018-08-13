var FCM = require('fcm-push');

const config = require('../config');
const exampleMessage = {
    to: 'registration_token_or_topics',
    collapse_key: 'your_collapse_key', // option
    data: {
        your_custom_data_key: 'your_custom_data_value' // option
    },
    notification: {
        title: 'Title of your push notification',
        body: 'Body of your push notification',
        click_action: "FCM_PLUGIN_ACTIVITY",
        icon: 'fcm_push_icon'
    }
};

const PushModule = (function () {
  const fcm = new FCM(config.google.fcmServerKey);
  return {
    send: async (message) => await fcm.send(message).catch(err => err)
  }
})();

module.exports = PushModule;
