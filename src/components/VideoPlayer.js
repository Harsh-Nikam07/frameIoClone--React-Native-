import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';

import { Video } from 'react-native-video'
import DrawingCanvas from './DrawingCanvas';



const { width } = Dimensions.get('window');

const VideoPlayer = forwardRef(({ 
  videoUri, 
  onTimeUpdate, 
  currentTime = 0,
  isDrawingMode = false,
  drawings = [],
  onDrawingComplete,
  selectedColor = '#FF0000',
  paused = false // <-- add this prop
}, ref) => {
  const [status, setStatus] = useState({});
  const [duration, setDuration] = useState(0);
  const [internalTime, setInternalTime] = useState(0); // Track actual video time
  const videoRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    pause: async () => {
      // No pauseAsync in react-native-video, use setNativeProps or control via state
      videoRef.current?.setNativeProps?.({ paused: true });
    },
    play: async () => {
      videoRef.current?.setNativeProps?.({ paused: false });
    },
    seekTo: async (timeSeconds) => {
      videoRef.current?.seek(timeSeconds);
    }
  }));

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Use onProgress for current time
  const handleProgress = (progress) => {
    setInternalTime(progress.currentTime);
    onTimeUpdate && onTimeUpdate(progress.currentTime);
  };

  // Use onLoad for duration
  const handleLoad = (meta) => {
    setDuration(meta.duration);
  };

  // Use internalTime for timestamp display
  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode="contain"
          paused={paused} // <-- use the prop here
          onProgress={handleProgress}
          onLoad={handleLoad}
          controls={true}
        />
        
        {/* Always show drawings, but only allow interaction in drawing mode */}
        <View style={styles.drawingOverlay} pointerEvents={isDrawingMode ? 'auto' : 'none'}>
          <DrawingCanvas
            style={styles.drawingCanvas}
            drawings={drawings}
            currentTime={internalTime}
            onDrawingComplete={isDrawingMode ? onDrawingComplete : undefined}
            selectedColor={selectedColor}
          />
        </View>
        
        {/* Timestamp Overlay */}
        <View style={styles.timeOverlay}>
          <Text style={styles.timeText}>
            {formatTime(internalTime)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  videoContainer: {
    width: width,
    height: width * (9/16),
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    // marginHorizontal: 16,
    marginTop: 16,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  drawingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  drawingCanvas: {
    flex: 1,
  },
  timeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});

export default VideoPlayer;