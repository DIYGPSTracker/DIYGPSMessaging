'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggers when an asset exits a geofence -> sends a notification.
 *
 * The Tracker places a Notification document into /Assets/{assetId}/Notifications/{notificationId}
 * Users save their device notification tokens to `/users/notificationTokens/{notificationToken}`.
 */
exports.sendGeofenceEcitedNotification = functions.database.ref('/Assets/{assetId}/Notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    // const assetId = context.params.assetId;
    // const notificationId = context.params.notificationId;

    const newNotification = snap.data();

    // Get the list of device notification tokens.
    /// TODO
    const tokensSnapshot = await admin.database()
        .ref(`/users/${followedUid}/notificationTokens`).once('value');

    // Check if there are any device tokens.
    if (!tokensSnapshot.hasChildren()) {
      return console.log('There are no notification tokens to send to.');
    }
    console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');

    // Notification details.
    const payload = {
      notification: {
        title: newNotification.title,
        body: newNotification.body
      }
    };

    // The array containing all the user's tokens, listing all tokens as an array.
    let tokens = Object.keys(tokensSnapshot.val());
    // Send notifications to all tokens.
    const response = await admin.messaging().sendToDevice(tokens, payload);
    // For each message check if there was an error.
    const tokensToRemove = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', tokens[index], error);
        // Cleanup the tokens who are not registered anymore.
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
          tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
        }
      }
    });
    return Promise.all(tokensToRemove);
  });
