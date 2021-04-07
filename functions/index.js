'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggers when an asset exits a geofence -> sends a notification.
 *
 * The Tracker places a Notification document into /Assets/{assetId}/Notifications/{notificationId}
 */
exports.sendGeofenceExitedNotification = functions.database.ref('/Assets/{assetId}/Notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const topic = "geo_fence_exited";
    const newNotification = snap.data();

    // Notification details.
    const payload = {
      notification: {
        title: newNotification.title,
        body: newNotification.body
      }
    };

    // Send notifications to the topic.
    const response = await admin.messaging().sendToTopic(topic, payload);
    return snap.ref.update({"processed": true});
  });
