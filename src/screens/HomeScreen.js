import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  FlatList,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';



import { 
    Video, 
    CloudUpload, 
    Upload, 
    CircleCheckBig,
    RotateCcw,
    MessageCircle,
    Play,
    Trash,
    VideoOff 
   } from "lucide-react-native";

import StorageService from '../services/StorageService';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [videosWithMetadata, setVideosWithMetadata] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const buttonScale = new Animated.Value(1);
  
  // Load uploaded videos on component mount
  useEffect(() => {
    console.log('HomeScreen mounted, loading videos...');
    loadUploadedVideos();
  }, []);

  // Refresh data when returning from video screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUploadedVideos();
    });
    return unsubscribe;
  }, [navigation]);

  // Request permissions for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        ]);
        
        const allPermissionsGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allPermissionsGranted) {
          Alert.alert(
            'Permissions Required',
            'This app needs storage permissions to access your videos.',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS doesn't need explicit permission request for image picker
  };
  
  const loadUploadedVideos = async () => {
    try {
      setLoading(true);
      const videos = await StorageService.getVideos();
      setUploadedVideos(videos);

      if (videos.length === 0) {
        setVideosWithMetadata([]);
        setLoading(false);
        return;
      }

      const videosWithData = [];
      for (let i = 0; i < videos.length; i++) {
        const videoUri = videos[i];
        try {
          const videoData = await StorageService.loadVideoData(videoUri);
          const commentsCount = videoData.comments ? videoData.comments.length : 0;
          const drawingsCount = videoData.drawings ? videoData.drawings.length : 0;

          const allActivities = [];
          if (videoData.comments) {
            videoData.comments.forEach(comment => {
              if (comment.createdAt) {
                allActivities.push({ type: 'comment', date: comment.createdAt });
              }
            });
          }
          if (videoData.drawings) {
            videoData.drawings.forEach(drawing => {
              if (drawing.createdAt) {
                allActivities.push({ type: 'drawing', date: drawing.createdAt });
              }
            });
          }

          allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
          const lastActivity = allActivities.length > 0 ? allActivities[0].date : null;

          videosWithData.push({
            uri: videoUri,
            name: videoUri.split('/').pop() || `Video ${i + 1}`,
            commentsCount,
            drawingsCount,
            lastActivity,
            totalAnnotations: commentsCount + drawingsCount,
          });
        } catch (error) {
          videosWithData.push({
            uri: videoUri,
            name: videoUri.split('/').pop() || `Video ${i + 1}`,
            commentsCount: 0,
            drawingsCount: 0,
            lastActivity: null,
            totalAnnotations: 0,
          });
        }
      }

      videosWithData.sort((a, b) => {
        if (a.lastActivity && b.lastActivity) {
          return new Date(b.lastActivity) - new Date(a.lastActivity);
        } else if (a.lastActivity) {
          return -1;
        } else if (b.lastActivity) {
          return 1;
        } else {
          return b.totalAnnotations - a.totalAnnotations;
        }
      });

      setVideosWithMetadata(videosWithData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUploadedVideos();
    setRefreshing(false);
  };

  const selectVideo = async () => {
    try {
      const options = {
        mediaType: 'video',
        selectionLimit: 1,
        includeBase64: false,
        quality: 1,
      };

      launchImageLibrary(options, async (response) => {
        console.log('ImagePicker response:', response);
        
        if (response.didCancel) {
          console.log('User cancelled video picker');
          return;
        }
        
        if (response.errorCode) {
          console.error('ImagePicker Error Code:', response.errorCode);
          console.error('ImagePicker Error Message:', response.errorMessage);
          
          let errorMessage = 'Failed to open gallery';
          
          if (response.errorCode === 'permission') {
            // Try to request permissions manually if image picker fails
            const hasPermission = await requestStoragePermission();
            if (hasPermission) {
              // Retry after getting permission
              selectVideo();
              return;
            }
            errorMessage = 'Permission denied. Please grant storage permission in Settings.';
          } else if (response.errorCode === 'camera_unavailable') {
            errorMessage = 'Gallery is not available';
          } else {
            errorMessage = `Error: ${response.errorMessage || 'Unknown error'}`;
          }
          
          Alert.alert('Error', errorMessage);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const video = response.assets[0];
          console.log('Picked video:', video);

          // Check if video URI is valid
          if (!video.uri) {
            Alert.alert('Error', 'Invalid video selected');
            return;
          }

          setSelectedVideo(video);
          await StorageService.addVideo(video.uri);
          await loadUploadedVideos();
        } else {
          console.log('No video selected');
        }
      });
    } catch (error) {
      console.error('Error in selectVideo:', error);
      Alert.alert('Error', 'An unexpected error occurred while selecting video');
    }
  };

  const navigateToVideo = (uri) => {
    if (uri) {
      navigation.navigate('Video', { videoUri: uri });
    } else if (selectedVideo) {
      navigation.navigate('Video', { videoUri: selectedVideo.uri });
    } else {
      navigation.navigate('Video', {
        videoUri: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
      });
    }
  };

  const deleteVideo = async (videoUri) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video and all its comments/drawings?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting video:', videoUri);
              await StorageService.deleteVideo(videoUri);
              await loadUploadedVideos();
            } catch (error) {
              console.error('Error deleting video:', error);
              Alert.alert('Error', 'Failed to delete video');
            }
          }
        }
      ]
    );
  };

  const formatLastActivity = (dateString) => {
    if (!dateString) return 'No activity';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  // Header component to render at the top of the FlatList
  const renderHeader = () => (
    <>
      <LinearGradient
        colors={['#4A55A2', '#6A5ACD']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {/* <Feather name="video" size={32} color="#fff" /> */}
             <Video color="#fff" size={32} />
            <Text style={styles.title}>Frame.io Clone</Text>
          </View>
          <Text style={styles.subtitle}>Professional Video Review & Collaboration</Text>
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <CloudUpload size={32} color="#2a5298" />
            </View>
          </View>
          
          <Text style={styles.welcomeText}>Welcome to Frame.io Clone</Text>
          <Text style={styles.description}>
            Upload your video to get started with frame-accurate commenting and collaboration.
          </Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.uploadButton]}
            onPress={selectVideo}
            activeOpacity={0.9}
          >
            <Upload size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>
              {selectedVideo ? 'Upload Another Video' : 'Upload Video'}
            </Text>
          </TouchableOpacity>
          
          {selectedVideo && (
            <View style={styles.selectedVideoContainer}>
              <View style={styles.selectedVideoInfo}>
                <CircleCheckBig size={20} color="#4CAF50" style={styles.checkIcon} />
                <Text style={styles.selectedVideoName} numberOfLines={1}>
                  {selectedVideo.fileName || selectedVideo.name || 'Selected Video'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => navigateToVideo(selectedVideo.uri)}
                activeOpacity={0.9}
              >
                <Play
                  size={16} 
                  color="#fff" // <-- changed from "#fff" to a visible color
                //   style={styles.buttonIcon} 
                />
                <Text style={styles.primaryButtonText}>
                  Open Video
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Videos List Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Your Videos ({videosWithMetadata.length})
          </Text>
          <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
            <RotateCcw 
              
              size={20} 
              color="#4A55A2" 
              style={[refreshing && { opacity: 0.5 }]} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
  
  const renderVideoItem = ({ item, index }) => {
    console.log(`Rendering video item ${index}:`, item);
    
    return (
      <View style={styles.videoItemWrapper}>
        <TouchableOpacity 
          style={styles.videoItem}
          onPress={() => navigateToVideo(item.uri)}
          activeOpacity={0.7}
        >
          <View style={styles.videoItemContent}>
            <View style={styles.videoIconContainer}>
              <Video  size={24} color="#4A55A2" />
            </View>
            
            <View style={styles.videoInfo}>
              <Text style={styles.videoName} numberOfLines={2}>
                {item.name || 'Unnamed Video'}
              </Text>
              
              <View style={styles.videoMetadata}>
                <View style={styles.statsContainer}>
                  {item.commentsCount > 0 && (
                    <View style={styles.statItem}>
                      <MessageCircle size={12} color="#666" />
                      <Text style={styles.statText}>{item.commentsCount}</Text>
                    </View>
                  )}
                  
                  {item.totalAnnotations === 0 && (
                    <Text style={styles.noAnnotationsText}>No annotations</Text>
                  )}
                </View>
                
                <Text style={styles.lastActivityText}>
                  {formatLastActivity(item.lastActivity)}
                </Text>
              </View>
            </View>
            
          </View>
          <View style={styles.videoActions}>
            <TouchableOpacity
              style={styles.actionButtonPlay}
              onPress={() => navigateToVideo(item.uri)}
            >
              <Play size={18} color="#4A55A2" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButtonDelete}
              onPress={() => deleteVideo(item.uri)}
            >
              <Trash size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <VideoOff  size={48} color="#ccc" />
      <Text style={styles.emptyTitle}>No Videos Yet</Text>
      <Text style={styles.emptySubtext}>
        Upload your first video to get started with frame-accurate commenting and collaboration.
      </Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.listFooter} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A55A2" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={videosWithMetadata}
        keyExtractor={(item, index) => `${item.uri}_${index}`}
        renderItem={renderVideoItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A55A2']}
            tintColor="#4A55A2"
          />
        }
        contentContainerStyle={videosWithMetadata.length === 0 ? styles.emptyListContainer : null}
        bounces={true}
        overScrollMode="auto"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerGradient: {
    paddingTop: 80,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    backgroundColor: '#4A55A2',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#4A55A2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 85, 162, 0.1)',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 15,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(42, 82, 152, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A55A2',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: '#5D6B98',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
    fontWeight: '400',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    elevation: 2,
  },
  uploadButton: {
    backgroundColor: '#4A55A2',
  },
  playButton: {
    backgroundColor: '#4A55A2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 0,
    width: '100%',
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedVideoContainer: {
    width: '100%',
    marginBottom: 15,
  },
  selectedVideoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  checkIcon: {
    marginRight: 10,
  },
  selectedVideoName: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    marginLeft: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  
  // Videos List Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A55A2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  videoItemWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  videoItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  videoItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  videoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
    marginRight: 12,
  },
  videoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  videoMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  noAnnotationsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  lastActivityText: {
    fontSize: 12,
    color: '#999',
  },
  videoActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButtonPlay: {
    width: "48%",
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4A55A2',
  },
  actionButtonDelete: {
    width: "48%",
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(255, 0, 0)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  listFooter: {
    height: 20,
  },
});

export default HomeScreen;