module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        // Use .env.production for production builds, .env.development otherwise
        path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],
  ],
};
