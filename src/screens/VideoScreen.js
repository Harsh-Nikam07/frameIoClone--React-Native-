import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
} from 'react-native';
import VideoPlayer from '../components/VideoPlayer';
import CommentsList from '../components/CommentsList';
import ColorPicker from '../components/ColorPicker';
import StorageService from '../services/StorageService';




import { 
    ArrowLeft,
    Ellipsis,
    Pencil
 } from 'lucide-react-native';



const VideoScreen = ({ route, navigation }) => {
  const { videoUri } = route.params;
  
  const [currentTime, setCurrentTime] = useState(0);
  const [comments, setComments] = useState([]);
  const [allDrawings, setAllDrawings] = useState([]);
  const [currentDrawings, setCurrentDrawings] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [commentText, setCommentText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingDrawing, setPendingDrawing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  
  const videoPlayerRef = useRef(null);
  const commentInputRef = useRef(null);

  useEffect(() => {
    loadData();
    // Set status bar style
    StatusBar.setBarStyle('light-content');
    
    // Clean up function
    return () => {
      // Save any pending changes before leaving
      if (pendingDrawing && commentText.trim()) {
        handleSubmitComment();
      }
    };
  }, [videoUri]);

  const loadData = async () => {
    if (!videoUri) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading data for video:', videoUri);
      
      const savedData = await StorageService.loadVideoData(videoUri);
      console.log('Loaded data:', {
        comments: savedData.comments.length,
        drawings: savedData.drawings.length
      });
      
      setComments(savedData.comments || []);
      setAllDrawings(savedData.drawings || []);
      
      // Filter drawings for the current time (initially 0)
      updateCurrentDrawings(savedData.drawings || [], currentTime);
    } catch (error) {
      console.error('Error loading video data:', error);
      setComments([]);
      setAllDrawings([]);
      setCurrentDrawings([]);
      Alert.alert('Error', 'Failed to load video data');
    } finally {
      setLoading(false);
    }
  };
  
  const updateCurrentDrawings = (drawings, time) => {
    if (!drawings || !Array.isArray(drawings)) {
      setCurrentDrawings([]);
      return;
    }
    
    const TOLERANCE = 1; // 1 second tolerance
    const filtered = drawings.filter(drawing => {
      // Ensure drawing and timestamp exist
      if (!drawing || typeof drawing.timestamp !== 'number') return false;
      
      // Check if drawing's timestamp is within the tolerance of current time
      return Math.abs(drawing.timestamp - time) <= TOLERANCE;
    });
    
    setCurrentDrawings(filtered || []);
  };

  const handleTimeUpdate = (time) => {
    // Round to 2 decimal places to prevent excessive updates
    const roundedTime = Math.round(time * 100) / 100;
    
    // Only update if time has changed significantly
    if (Math.abs(currentTime - roundedTime) > 0.1) {
      setCurrentTime(roundedTime);
      // Update current drawings when time changes
      updateCurrentDrawings(allDrawings, roundedTime);
    }
  };

  const handleCommentFocus = () => {
    setPaused(true); // Pause video when adding comment
    setIsTyping(true);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.pause();
    }
  };

  const handleCommentBlur = () => {
    setIsTyping(false);
  };

  const handleSubmitComment = async () => {
    if ((commentText.trim() || pendingDrawing) && videoUri) {
      const commentId = Date.now().toString();
      const comment = {
        id: commentId,
        text: commentText.trim() || 'Drawing annotation',
        timestamp: currentTime,
        createdAt: new Date().toISOString(),
        hasDrawing: pendingDrawing !== null,
      };

      try {
        console.log('Saving comment:', comment);
        
        const updatedData = await StorageService.addCommentWithDrawing(
          videoUri,
          comment,
          pendingDrawing
        );
        
        console.log('Comment saved successfully');
        
        setComments(updatedData.comments);
        setAllDrawings(updatedData.drawings);
        updateCurrentDrawings(updatedData.drawings, currentTime);
        
        setCommentText('');
        setPendingDrawing(null);
        Keyboard.dismiss();
        setIsTyping(false);
      } catch (error) {
        console.error('Error saving comment:', error);
        Alert.alert('Error', 'Failed to save comment. Please try again.');
      }
    }
  };

  const handleDrawingComplete = async (drawing) => {
    try {
      // Ensure we have the exact current time when the drawing was made
      const drawingTime = currentTime;
      const newDrawing = {
        ...drawing,
        id: Date.now().toString(),
        timestamp: drawingTime,
        createdAt: new Date().toISOString()
      };
      
      console.log('Saving drawing:', newDrawing);
      
      // Save the drawing immediately
      await StorageService.addDrawing(videoUri, newDrawing);
      
      // Update local state
      const updatedDrawings = [...allDrawings, newDrawing];
      setAllDrawings(updatedDrawings);
      updateCurrentDrawings(updatedDrawings, drawingTime);
      
      // Set pending drawing for potential comment
      const drawingWithComment = {
        ...newDrawing,
        linkedToComment: true
      };
      setPendingDrawing(drawingWithComment);
      
      console.log('Drawing saved successfully');
      
    } catch (error) {
      console.error('Error saving drawing:', error);
      Alert.alert('Error', 'Failed to save drawing. Please try again.');
    }
    
    // Auto-focus comment input after drawing
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 300);
  };

  const handleCommentPress = (comment) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(comment.timestamp);
      setTimeout(() => {
        videoPlayerRef.current.play();
      }, 100);
    }
    setShowComments(false);
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode((prev) => {
      const next = !prev;
      if (next) setPaused(true); // Pause video when drawing starts
      else setPaused(false);     // Resume when drawing ends
      return next;
    });
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all comments and drawings for this video?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData(videoUri);
              setComments([]);
              setAllDrawings([]);
              setCurrentDrawings([]);
              setPendingDrawing(null);
              console.log('All data cleared for video:', videoUri);
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading video data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Video Player</Text>
          {/* <Text style={styles.headerSubtitle}>
            {comments.length} comments • {allDrawings.length} drawings
          </Text> */}
        </View>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={clearAllData}
        >
          <Ellipsis size={24} color="white" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Video Section */}
        <View style={styles.videoSection}>
          <VideoPlayer
            ref={videoPlayerRef}
            videoUri={videoUri}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            isDrawingMode={isDrawingMode}
            drawings={allDrawings}
            onDrawingComplete={handleDrawingComplete}
            selectedColor={selectedColor}
            paused={paused} // <-- pass paused prop
          />

          {isDrawingMode && (
            <ColorPicker
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
          )}
        </View>

        {/* Main Content Area */}
        <View style={styles.contentSection}>
          {/* Comments List */}
          <View style={styles.commentsListContainer}>
            <Text style={styles.commentsHeader}>Comments ({comments.length})</Text>
            <CommentsList
              comments={comments}
              onCommentPress={handleCommentPress}
            />
          </View>

          {/* Comment Input Section */}
          <View style={styles.commentInputSection}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.drawButton,
                  isDrawingMode && styles.drawButtonActive
                ]}
                onPress={toggleDrawingMode}
              >
                <Pencil size={16} color={isDrawingMode ? 'white' : '#333'} />
                <Text style={styles.drawButtonText}>
                  {isDrawingMode ? 'Drawing...' : 'Draw'}
                </Text>
              </TouchableOpacity>
            </View>

            {pendingDrawing && (
              <View style={styles.drawingAttached}>
                <Text style={styles.drawingAttachedText}>🖌️ Drawing attached</Text>
              </View>
            )}
            
            <View style={styles.commentInputContainer}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                placeholder={isDrawingMode ? 'Add a note about your drawing...' : 'Add a comment...'}
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                onFocus={handleCommentFocus}
                onBlur={handleCommentBlur}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!commentText.trim() && !pendingDrawing) && styles.sendButtonDisabled
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() && !pendingDrawing}
              >
                <Text style={styles.sendButtonText}>Comment</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.timestampIndicator}>
              {isDrawingMode ? 'Draw on the video and add a note' : 'You can select the color of the pencil'}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  videoSection: {
    backgroundColor: '#000',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    flexDirection: 'column',
  },
  commentsListContainer: {
    flex: 1,
    padding: 16,
  },
  commentsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  drawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  drawButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  drawButtonActive: {
    backgroundColor: '#007AFF',
  },
  drawButtonIcon: {
    fontSize: 18,
  },
  commentInputSection: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drawingAttached: {
    backgroundColor: '#f0f7ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawingAttachedText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    color: '#333',
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  timestampIndicator: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default VideoScreen;