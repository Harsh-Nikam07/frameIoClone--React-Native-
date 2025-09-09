# Frame.io Clone

A React Native application for professional video review and collaboration, inspired by Frame.io. This app allows users to upload videos, add frame-accurate comments, annotate with drawings, and collaborate efficiently.

<img width="1053" height="753" alt="Frame 4" src="https://github.com/user-attachments/assets/c5579778-0234-4c3a-843b-d23780c6c41f" />


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
