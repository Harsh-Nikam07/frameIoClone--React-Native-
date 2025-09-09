import React from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { Pencil } from 'lucide-react-native';

// Fixed user data array
const USERS = Array.from({length: 6}, (_, i) => ({
  id: Math.floor(Math.random() * 1000000),
  name: `User ${i+1}`,
  color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
}));

// Helper function to get user by ID
const getUserById = (userId) => {
  const user = USERS.find(user => user.id === userId) || USERS[0];
  return {
    ...user,
    initials: user.name.split(' ').map(n => n[0]).join('')
  };
};

const CommentItem = ({ comment, onPress }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Get user data based on comment.userId or default to first user
  const user = getUserById(comment.userId || 1);

  return (
    <TouchableOpacity 
      style={styles.commentItem} 
      onPress={() => onPress(comment)}
      activeOpacity={0.7}
    >
      <View style={styles.commentHeader}>
        <View style={styles.leftSection}>
          <View style={[styles.avatar, { backgroundColor: user.color }]}>
            <Text style={styles.avatarText}>{user.initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.timestampRow}>
              <Text style={styles.timestamp}>{formatTime(comment.timestamp)}</Text>
              {comment.hasDrawing && (
                <View style={styles.drawingBadge}>
                  <Pencil size={12} color="#666" />
                </View>
              )}
            </View>
          </View>
        </View>
        <Text style={styles.timeAgo}>{formatDate(comment.createdAt)}</Text>
      </View>
      <Text style={styles.commentText} numberOfLines={3}>
        {comment.text}
      </Text>
    </TouchableOpacity>
  );
};

const CommentsList = ({ comments, onCommentPress }) => {
  const sortedComments = [...comments].sort((a, b) => a.timestamp - b.timestamp);

  if (comments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
        </View>
        <Text style={styles.emptyTitle}>No comments yet</Text>
        <Text style={styles.emptySubtext}>
          Be the first to leave a comment on this video
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sortedComments}
      keyExtractor={(item) => `${item.id}_${item.timestamp}_${item.createdAt}`}
      renderItem={({ item }) => (
        <CommentItem 
          comment={item} 
          onPress={onCommentPress}
        />
      )}
      style={styles.list}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },
  commentItem: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom:10,
    borderRadius: 12,

  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  drawingBadge: {
    marginLeft: 8,
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  drawingIcon: {
    fontSize: 12,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginLeft: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 32,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CommentsList;