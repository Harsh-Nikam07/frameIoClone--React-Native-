import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  PanResponder,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const DrawingCanvas = ({ 
  style, 
  currentTime = 0, 
  onDrawingComplete,
  selectedColor = '#FF0000',
  strokeWidth = 3,
  drawings = []
}) => {
  const [currentPath, setCurrentPath] = useState('');
  const pathRef = useRef('');

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const newPath = `M${locationX.toFixed(2)},${locationY.toFixed(2)}`;
      pathRef.current = newPath;
      setCurrentPath(newPath);
    },

    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const newPath = `${pathRef.current} L${locationX.toFixed(2)},${locationY.toFixed(2)}`;
      pathRef.current = newPath;
      setCurrentPath(newPath);
    },

    onPanResponderRelease: () => {
      if (pathRef.current && onDrawingComplete) {
        const newDrawing = {
          id: Date.now().toString(),
          path: pathRef.current,
          color: selectedColor,
          strokeWidth,
          timestamp: currentTime,
          createdAt: new Date().toISOString(),
        };
        
        onDrawingComplete(newDrawing);
        setCurrentPath('');
        pathRef.current = '';
      }
    },
  });

  // Filter and prepare drawings that should be visible at current time
  const visibleDrawings = useMemo(() => {
    if (!drawings || !Array.isArray(drawings)) return [];
    
    return drawings
      .filter(drawing => {
        if (!drawing || typeof drawing.timestamp !== 'number') return false;
        return Math.abs(drawing.timestamp - currentTime) <= 1; // Show drawings within 1 second
      })
      .map(drawing => ({
        ...drawing,
        // Create a unique key using both ID and timestamp to prevent duplicates
        uniqueKey: `${drawing.id}_${drawing.timestamp}_${drawing.createdAt || ''}`
      }));
  }, [drawings, currentTime]);

  return (
    <View style={[style]} {...panResponder.panHandlers}>
      <Svg
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10 // Ensure drawings appear above the video
        }}
        pointerEvents="none" // Allow clicks to pass through to the video player
      >
        {/* Render visible drawings */}
        {visibleDrawings.map((drawing, idx) => {
          // Use a guaranteed unique key by appending the index
          const key = `${drawing.id}_${drawing.timestamp}_${drawing.createdAt || ''}_${idx}`;
          return (
            <Path
              key={key}
              d={drawing.path}
              stroke={drawing.color}
              strokeWidth={drawing.strokeWidth}
              fill="transparent"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        
        {/* Render current path being drawn */}
        {currentPath !== '' && (
          <Path
            d={currentPath}
            stroke={selectedColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
    </View>
  );
};

export default DrawingCanvas;