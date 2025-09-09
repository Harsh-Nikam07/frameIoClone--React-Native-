import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const VIDEOS_KEY = '@frameio_videos';

// Helper function to generate storage keys for a specific video
const getVideoCommentsKey = (videoUri) => `@frameio_video_${videoUri}_comments`;
const getVideoDrawingsKey = (videoUri) => `@frameio_video_${videoUri}_drawings`;

class StorageService {
  // --- Helpers for JSON storage ---
  static setItem(key, value) {
    storage.set(key, JSON.stringify(value));
  }

  static getItem(key, defaultValue = null) {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : defaultValue;
  }

  static removeItem(key) {
    storage.delete(key);
  }

  static getAllKeys() {
    return storage.getAllKeys();
  }

  // --- Video management methods ---
  static async addVideo(videoUri) {
    const videos = this.getVideos();
    if (!videos.includes(videoUri)) {
      videos.push(videoUri);
      this.setItem(VIDEOS_KEY, videos);
    }
    return videos;
  }

  static getVideos() {
    return this.getItem(VIDEOS_KEY, []);
  }

  static async deleteVideo(videoUri) {
    const videos = this.getVideos();
    const updatedVideos = videos.filter(video => video !== videoUri);
    this.setItem(VIDEOS_KEY, updatedVideos);

    this.removeItem(getVideoCommentsKey(videoUri));
    this.removeItem(getVideoDrawingsKey(videoUri));

    return updatedVideos;
  }

  // --- Comments methods ---
  static async saveComments(videoUri, comments) {
    const key = getVideoCommentsKey(videoUri);
    this.setItem(key, comments);
    await this.addVideo(videoUri);
  }

  static loadComments(videoUri) {
    return this.getItem(getVideoCommentsKey(videoUri), []);
  }

  static async addComment(videoUri, comment) {
    const existingComments = this.loadComments(videoUri);
    const updatedComments = [...existingComments, comment];
    await this.saveComments(videoUri, updatedComments);
    return updatedComments;
  }

  // --- Drawings methods ---
  static saveDrawings(videoUri, drawings) {
    this.setItem(getVideoDrawingsKey(videoUri), drawings);
  }

  static loadDrawings(videoUri) {
    return this.getItem(getVideoDrawingsKey(videoUri), []);
  }

  static async addDrawing(videoUri, drawing) {
    const existingDrawings = this.loadDrawings(videoUri);
    const updatedDrawings = [...existingDrawings, drawing];
    this.saveDrawings(videoUri, updatedDrawings);
    return updatedDrawings;
  }

  // --- Combined video data ---
  static loadVideoData(videoUri) {
    const comments = this.loadComments(videoUri);
    const drawings = this.loadDrawings(videoUri);
    return { comments, drawings };
  }

  static async addCommentWithDrawing(videoUri, comment, drawing = null) {
    const { comments, drawings } = this.loadVideoData(videoUri);

    const updatedComments = [...comments, comment];
    let updatedDrawings = drawings;

    if (drawing) {
      const linkedDrawing = {
        ...drawing,
        linkedCommentId: comment.id,
        timestamp: comment.timestamp,
      };
      updatedDrawings = [...drawings, linkedDrawing];
    }

    await Promise.all([
      this.saveComments(videoUri, updatedComments),
      this.saveDrawings(videoUri, updatedDrawings),
    ]);

    return { comments: updatedComments, drawings: updatedDrawings };
  }

  // --- Query helpers ---
  static getDrawingsForComment(videoUri, commentId) {
    const drawings = this.loadDrawings(videoUri);
    return drawings.filter(drawing => drawing.linkedCommentId === commentId);
  }

  static getDrawingsForTimestamp(videoUri, timestamp, tolerance = 1) {
    const drawings = this.loadDrawings(videoUri);
    return drawings.filter(
      drawing => Math.abs(drawing.timestamp - timestamp) <= tolerance
    );
  }

  // --- Cleanup & deletion ---
  static clearAllData(videoUri) {
    if (!videoUri) throw new Error('Video URI is required to clear data');
    this.removeItem(getVideoCommentsKey(videoUri));
    this.removeItem(getVideoDrawingsKey(videoUri));
  }

  static async deleteComment(videoUri, commentId) {
    const { comments, drawings } = this.loadVideoData(videoUri);

    const updatedComments = comments.filter(c => c.id !== commentId);
    const updatedDrawings = drawings.filter(
      d => d.linkedCommentId !== commentId
    );

    await Promise.all([
      this.saveComments(videoUri, updatedComments),
      this.saveDrawings(videoUri, updatedDrawings),
    ]);

    return { comments: updatedComments, drawings: updatedDrawings };
  }

  // --- Metadata & stats ---
  static async getVideosMetadata() {
    const videos = this.getVideos();
    return Promise.all(
      videos.map(videoUri => {
        try {
          const { comments, drawings } = this.loadVideoData(videoUri);

          const allActivities = [
            ...comments.map(c => ({ type: 'comment', date: c.createdAt })),
            ...drawings.map(d => ({ type: 'drawing', date: d.createdAt })),
          ].filter(a => a.date);

          allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
          const lastActivity =
            allActivities.length > 0 ? allActivities[0].date : null;

          return {
            uri: videoUri,
            name: videoUri.split('/').pop() || 'Unknown Video',
            commentsCount: comments.length,
            drawingsCount: drawings.length,
            totalAnnotations: comments.length + drawings.length,
            lastActivity,
          };
        } catch (error) {
          console.error(`Error getting metadata for video ${videoUri}:`, error);
          return {
            uri: videoUri,
            name: videoUri.split('/').pop() || 'Unknown Video',
            commentsCount: 0,
            drawingsCount: 0,
            totalAnnotations: 0,
            lastActivity: null,
          };
        }
      })
    );
  }

  static async getStorageStats() {
    const videos = this.getVideos();
    let totalComments = 0;
    let totalDrawings = 0;

    for (const videoUri of videos) {
      const { comments, drawings } = this.loadVideoData(videoUri);
      totalComments += comments.length;
      totalDrawings += drawings.length;
    }

    return {
      totalVideos: videos.length,
      totalComments,
      totalDrawings,
      totalAnnotations: totalComments + totalDrawings,
    };
  }

  static cleanupOrphanedData() {
    const videos = this.getVideos();
    const allKeys = this.getAllKeys();

    const videoKeys = allKeys.filter(
      key =>
        key.startsWith('@frameio_video_') &&
        (key.includes('_comments') || key.includes('_drawings'))
    );

    const orphanedKeys = videoKeys.filter(
      key => !videos.some(video => key.includes(video))
    );

    orphanedKeys.forEach(key => this.removeItem(key));

    if (orphanedKeys.length > 0) {
      console.log(`Cleaned up ${orphanedKeys.length} orphaned data entries`);
    }

    return orphanedKeys.length;
  }
}

export default StorageService;
