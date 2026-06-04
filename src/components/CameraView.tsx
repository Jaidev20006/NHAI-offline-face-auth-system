/**
 * CameraView — MLKit face detection via periodic takePhoto()
 * Works with react-native-vision-camera v4 + @react-native-ml-kit/face-detection
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, ActivityIndicator, Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import FaceDetection, {
  FaceDetectorContourMode,
  FaceDetectorLandmarkMode,
  FaceDetectorClassificationMode,
} from '@react-native-ml-kit/face-detection';
import { FaceData } from '../hooks/userFaceAuth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CameraViewProps {
  overlayText?: string;
  active?: boolean;
  onFaceData?: (data: FaceData) => void;
  showDebug?: boolean;
}

const DEFAULT_FACE: FaceData = {
  faceDetected: false,
  leftEyeOpen: 1,
  rightEyeOpen: 1,
  smilingProb: 0,
  headYaw: 0,
  headPitch: 0,
  bounds: null,
};

export default function CameraView({
  overlayText,
  onFaceData,
  showDebug = false,
}:

CameraViewProps) {
  console.log('🟡 CameraView rendered, device:', device?.id);
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Waiting for camera...');
  const cameraRef = useRef<Camera>(null);
  const scanInterval = useRef<NodeJS.Timeout | null>(null);
  const isScanning = useRef(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
      return;
    }
    const t = setTimeout(() => setCameraReady(true), 600);
    return () => clearTimeout(t);
  }, [hasPermission]);

  const scanFace = useCallback(async () => {
    if (!cameraRef.current || isScanning.current || !cameraReady) return;
    isScanning.current = true;

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
        skipMetadata: true,
      });

      const faces = await FaceDetection.detect(`file://${photo.path}`, {
        landmarkMode: FaceDetectorLandmarkMode.ALL,
        contourMode: FaceDetectorContourMode.NONE,
        classificationMode: FaceDetectorClassificationMode.ALL,
        performanceMode: 'fast',
      });

      if (faces.length === 0) {
        onFaceData?.(DEFAULT_FACE);
        if (showDebug) setDebugInfo('👤 No face detected');
      } else {
        const face = faces[0];
        const data: FaceData = {
          faceDetected: true,
          leftEyeOpen: face.leftEyeOpenProbability ?? 1,
          rightEyeOpen: face.rightEyeOpenProbability ?? 1,
          smilingProb: face.smilingProbability ?? 0,
          headYaw: face.headEulerAngleY ?? 0,
          headPitch: face.headEulerAngleX ?? 0,
          bounds: face.frame
            ? {
                x: face.frame.left,
                y: face.frame.top,
                width: face.frame.width,
                height: face.frame.height,
              }
            : null,
        };
        onFaceData?.(data);
        if (showDebug) {
          setDebugInfo(
            `👤 Y:${data.headYaw.toFixed(0)}° P:${data.headPitch.toFixed(0)}° ` +
            `👁L:${(data.leftEyeOpen * 100).toFixed(0)}% R:${(data.rightEyeOpen * 100).toFixed(0)}% ` +
            `😊${(data.smilingProb * 100).toFixed(0)}%`
          );
        }
      }
    } catch (e: any) {
      if (showDebug) setDebugInfo(`Scan error: ${e.message}`);
    } finally {
      isScanning.current = false;
    }
  }, [cameraReady, onFaceData, showDebug]);

  // Start scanning every 500ms when camera is ready
  useEffect(() => {
    if (!cameraReady) return;
    scanInterval.current = setInterval(scanFace, 500);
    return () => {
      if (scanInterval.current) clearInterval(scanInterval.current);
    };
  }, [cameraReady, scanFace]);

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.message}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.message}>Loading front camera…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cameraReady && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          pixelFormat="yuv"
          enableZoomGesture={false}
          onError={(e) => console.warn('CameraError:', e.message)}
          onInitialized={() => console.log('✅ Camera initialized')}
        />
      )}

      {!cameraReady && (
        <View style={[StyleSheet.absoluteFill, styles.centered]}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.message}>Starting camera…</Text>
        </View>
      )}

      {/* Oval face guide */}
      <View style={styles.ovalGuide} />

      {/* Overlay instruction */}
      {overlayText ? (
        <View style={styles.overlayBanner}>
          <Text style={styles.overlayText}>{overlayText}</Text>
        </View>
      ) : null}

      {/* Debug panel */}
      {showDebug ? (
        <View style={styles.debugPanel}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.52,
    backgroundColor: '#0A1628',
    overflow: 'hidden',
  },
  centered: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1628',
  },
  message: {
    marginTop: 12,
    color: '#8BA8CC',
    fontSize: 15,
    textAlign: 'center',
  },
  ovalGuide: {
    position: 'absolute',
    top: '8%',
    alignSelf: 'center',
    width: 210,
    height: 270,
    borderRadius: 135,
    borderWidth: 3,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
  },
  overlayBanner: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  overlayText: {
    color: '#4A90E2',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugPanel: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 6,
  },
  debugText: {
    color: '#00FF88',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});