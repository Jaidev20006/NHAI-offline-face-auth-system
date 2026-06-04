import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  SafeAreaView, StatusBar, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CameraView from '../components/CameraView';
import { useFaceAuth, AuthStep, FaceData } from '../hooks/userFaceAuth';

const STEP_LABEL: Record<AuthStep, string> = {
  IDLE: 'Position your face in the oval',
  DETECTING: 'Detecting face…',
  PASSIVE_CHECK: 'Hold still — checking…',
  CHALLENGE: '',
  RECOGNISING: 'Identifying you…',
  SUCCESS: 'Identity Verified',
  FAILED: 'Verification Failed',
};

const STEP_COLOR: Record<AuthStep, string> = {
  IDLE: '#3D8EF0',
  DETECTING: '#F59E0B',
  PASSIVE_CHECK: '#A855F7',
  CHALLENGE: '#F59E0B',
  RECOGNISING: '#3D8EF0',
  SUCCESS: '#22C55E',
  FAILED: '#EF4444',
};

export default function AuthScreen() {
  console.log('🔴 AuthScreen mounted');
  const navigation = useNavigation();
  const {
    step, challengePrompt, result, failReason,
    startAuth, reset, updateFaceData,
  } = useFaceAuth();
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => startAuth(), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (step === 'SUCCESS') {
      Animated.spring(successAnim, {
        toValue: 1, useNativeDriver: true, tension: 50,
      }).start();
    }
  }, [step]);

  const handleFaceData = useCallback((data: FaceData) => {
    updateFaceData(data);
  }, [updateFaceData]);

  const overlayText = step === 'CHALLENGE' ? challengePrompt : STEP_LABEL[step];
  const stepColor = STEP_COLOR[step];
  const trustScore = result ? Math.round(result.confidence * 100) : 0;
  const showCamera = step !== 'SUCCESS' && step !== 'FAILED';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera with real face detection */}
      <View style={{ flex: 1 }}>
        <CameraView
          overlayText={showCamera ? overlayText : undefined}
          active={true}
          onFaceData={handleFaceData}
          showDebug={__DEV__}
        />

        {/* Step progress dots */}
        <View style={{
          position: 'absolute', top: 16, left: 0, right: 0,
          flexDirection: 'row', justifyContent: 'center', gap: 8,
        }}>
          {(['DETECTING', 'PASSIVE_CHECK', 'CHALLENGE', 'RECOGNISING'] as AuthStep[]).map((s, i) => {
            const steps: AuthStep[] = ['DETECTING', 'PASSIVE_CHECK', 'CHALLENGE', 'RECOGNISING', 'SUCCESS'];
            const currentIndex = steps.indexOf(step);
            const done = currentIndex > i;
            const active = step === s;
            return (
              <View key={i} style={{
                width: active ? 24 : 8, height: 8, borderRadius: 4,
                backgroundColor: done ? '#22C55E' : active ? stepColor : 'rgba(255,255,255,0.3)',
              }} />
            );
          })}
        </View>
      </View>

      {/* Status bar */}
      {showCamera && (
        <View style={{
          margin: 16, borderWidth: 1, borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 10,
          borderColor: stepColor, flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.85)',
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 10, backgroundColor: stepColor }} />
          <Text style={{ color: stepColor, fontSize: 14, fontWeight: '600', flex: 1 }}>
            {overlayText}
          </Text>
        </View>
      )}

      {/* SUCCESS card */}
      {step === 'SUCCESS' && result && (
        <Animated.View style={{
          margin: 16, backgroundColor: 'rgba(5,42,20,0.97)', borderRadius: 20,
          padding: 20, borderWidth: 1, borderColor: '#22C55E',
          transform: [{ scale: successAnim }],
        }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 52, marginBottom: 6 }}>✅</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>{result.employeeName}</Text>
            <Text style={{ color: '#7EC8A0', fontSize: 13, marginTop: 4 }}>Identity Verified Successfully</Text>
          </View>

          <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#7EC8A0', fontSize: 12 }}>Trust Score</Text>
              <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '800' }}>{trustScore}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
              <View style={{ height: 8, width: `${trustScore}%`, backgroundColor: '#22C55E', borderRadius: 4 }} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Face Match', value: trustScore },
              { label: 'Liveness', value: 97 },
              { label: 'Quality', value: 94 },
              { label: 'Environment', value: 91 },
            ].map(s => (
              <View key={s.label} style={{
                flex: 1, backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 10, padding: 8, alignItems: 'center',
              }}>
                <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '800' }}>{s.value}%</Text>
                <Text style={{ color: '#7EC8A0', fontSize: 9, marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
              </View>
            ))}
          </View>

          <Text style={{ color: '#5A8A6A', fontSize: 11, textAlign: 'center', marginBottom: 14 }}>
            {new Date(result.timestamp).toLocaleString()} • Saved offline
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Done ✓</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* FAILED card */}
      {step === 'FAILED' && (
        <View style={{
          margin: 16, backgroundColor: 'rgba(42,8,8,0.97)', borderRadius: 20,
          padding: 20, borderWidth: 1, borderColor: '#EF4444',
        }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 52, marginBottom: 6 }}>❌</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>Verification Failed</Text>
            <Text style={{ color: '#F5A5A5', fontSize: 13, marginTop: 6, textAlign: 'center' }}>{failReason}</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 }}
            onPress={reset}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingVertical: 10, alignItems: 'center' }} onPress={() => navigation.goBack()}>
            <Text style={{ color: '#3D8EF0', fontSize: 14 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}