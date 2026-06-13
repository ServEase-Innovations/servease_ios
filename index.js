// index.js
import { AppRegistry } from 'react-native';
import React from 'react';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { Provider } from 'react-redux';
import store from './src/store/userStore';
import { AppUserProvider } from './src/context/AppUserContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler'; // keep at top if you use gesture-handler anywhere

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[push] background message', remoteMessage?.messageId);
});

const Root = () => (
  <Provider store={store}>
    
    <AppUserProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <App />
      </GestureHandlerRootView>
    </AppUserProvider>
  </Provider>
);

AppRegistry.registerComponent(appName, () => Root);
