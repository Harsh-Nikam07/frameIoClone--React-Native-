This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# Frame.io Clone

A React Native application for professional video review and collaboration, inspired by Frame.io. This app allows users to upload videos, add frame-accurate comments, annotate with drawings, and collaborate efficiently.

---

## Features

- **Video Upload & Management:** Upload videos from your device and manage them in a list.
- **Frame-Accurate Commenting:** Add comments at specific timestamps in a video.
- **Drawing/Annotation:** Draw directly on video frames and link drawings to comments.
- **Collaboration UI:** View comments and drawings, interact with annotations, and review content.
- **Persistent Storage:** All data is stored locally using MMKV for fast access.
- **Color Picker:** Select colors for drawing annotations.
- **Activity Metadata:** View last activity, annotation counts, and more for each video.

---

## Screenshots

*Video Player with comments and drawings, color picker, and annotation tools.*

---

## Project Structure

```
frameIOClone/
├── App.js
├── package.json
├── src/
│   ├── components/
│   │   ├── VideoPlayer.js
│   │   ├── DrawingCanvas.js
│   │   ├── CommentsList.js
│   │   ├── ColorPicker.js
│   │   └── AddComment.js
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   └── VideoScreen.js
│   ├── services/
│   │   └── StorageService.js
│   └── utils/
│       └── constants.js
```

---

## Installation

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd frameIOClone
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Link native dependencies (if not using Expo):**
   ```sh
   npx react-native link
   ```

4. **Run the app:**
   - Android:
     ```sh
     npm run android
     ```
   - iOS:
     ```sh
     npm run ios
     ```

---

## Usage

1. **Upload a Video:**  
   Use the upload button on the Home screen to select a video from your device.

2. **Review & Annotate:**  
   Open a video to view the player. Add comments at specific timestamps or draw annotations using the pencil tool.

3. **Collaboration:**  
   All comments and drawings are listed below the video. Tap a comment to jump to its timestamp.

4. **Manage Videos:**  
   Delete videos or clear all annotations from the video screen.

---

## Technologies Used

- **React Native** (0.81+)
- **react-native-video** for video playback
- **react-native-mmkv** for fast local storage
- **react-native-svg** for drawing annotations
- **lucide-react-native** for icons
- **react-native-image-picker** for video selection
- **react-navigation** for navigation
- **react-native-linear-gradient** for UI styling

---

## Key Files

- **App.js:** Entry point, navigation setup.
- **HomeScreen.js:** Video upload and list.
- **VideoScreen.js:** Video player, comments, drawings, annotation tools.
- **VideoPlayer.js:** Video playback and drawing overlay.
- **DrawingCanvas.js:** SVG-based drawing canvas.
- **CommentsList.js:** Comment display and interaction.
- **ColorPicker.js:** Color selection for drawing.
- **StorageService.js:** MMKV-based persistent storage.

---

## Customization

- **Drawing Colors:** Edit `src/utils/constants.js` or `ColorPicker.js` to change available colors.
- **Storage:** Uses MMKV for performance; can be swapped for other storage solutions if needed.
- **Icons:** Uses `lucide-react-native`, but can be replaced with other icon libraries.

---

## Troubleshooting

- **Icons not visible:** Ensure `lucide-react-native` is installed and linked. Adjust icon colors for visibility.
- **Keyboard covers input:** The comment input is wrapped in `KeyboardAvoidingView` for proper shifting.
- **Duplicate keys warning:** Drawing and comment keys are generated with unique IDs and timestamps.

---

## License

MIT

---

## Credits

Inspired by [Frame.io](https://frame.io/).  
Developed using open-source libraries for educational and demonstration
