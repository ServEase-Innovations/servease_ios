// index.js — gesture-handler and Firebase app must load before any other imports.
import 'react-native-gesture-handler';
import '@react-native-firebase/app';

import { AppRegistry } from 'react-native';
import React from 'react';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { Provider } from 'react-redux';
import store from './src/store/userStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Required for background FCM on Android; must run after @react-native-firebase/app.
try {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[push] background message', remoteMessage?.messageId);
  });
} catch (err) {
  console.warn('[push] background handler registration failed', err);
}

const Root = () => (
  <Provider store={store}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <App />
    </GestureHandlerRootView>
  </Provider>
);

AppRegistry.registerComponent(appName, () => Root);
