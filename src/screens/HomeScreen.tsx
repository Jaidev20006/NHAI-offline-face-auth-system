import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ScrollView, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { startSyncMonitor, stopSyncMonitor, SyncStatus } from '../services/SyncService';
import { warmUpModels } from '../services/FaceRecognition';
import { getPendingSyncCount, getRecentAttendance } from '../services/Database';
import { useTheme } from '../context/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const SYNC_COLOR: Record<SyncStatus, string> = {
  IDLE: '#F59E0B', SYNCING: '#3D8EF0', DONE: '#22C55E', ERROR: '#EF4444',
};
const SYNC_LABEL: Record<SyncStatus, string> = {
  IDLE: 'Offline — records queued', SYNCING: 'Syncing to cloud…',
  DONE: 'All records synced', ERROR: 'Sync failed — will retry',
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, theme, toggleTheme } = useTheme();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const [pendingCount, setPendingCount] = useState(0);
  const [modelsReady, setModelsReady] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [lastSync, setLastSync] = useState<string>('Never');
  const [logoTaps, setLogoTaps] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    warmUpModels().then(() => setModelsReady(true));
    startSyncMonitor((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
      if (status === 'DONE') setLastSync(new Date().toLocaleTimeString());
    });
    loadStats();
    return () => stopSyncMonitor();
  }, []);

  useEffect(() => {
    if (!modelsReady) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [modelsReady]);

  const loadStats = useCallback(async () => {
    try {
      const logs = await getRecentAttendance(200);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayLogs = logs.filter(l => l.timestamp >= today.getTime());
      setTodayCount(todayLogs.length);
      setSyncedCount(todayLogs.filter(l => l.synced).length);
      const pending = await getPendingSyncCount();
      setPendingCount(pending);
    } catch (_) {}
  }, []);

  const handleLogoTap = () => {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) { setLogoTaps(0); navigation.navigate('Admin' as any); }
  };

  const c = colors;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />
      <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 }}>
          <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.8}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: c.text, letterSpacing: 6 }}>NHAI</Text>
            <Text style={{ fontSize: 9, color: c.accent, letterSpacing: 1.5, marginTop: 2 }}>SECURE IDENTITY VERIFICATION SYSTEM</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={{ padding: 8, backgroundColor: c.bgCard, borderRadius: 20, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ fontSize: 18 }}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* AI Engine Status */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, marginRight: 10, backgroundColor: modelsReady ? c.success : c.warning }} />
            <View>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{modelsReady ? 'AI Engine Ready' : 'Initializing AI Engine…'}</Text>
              <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 2 }}>BlazeFace + MobileFaceNet ArcFace • 7MB • CPU-only</Text>
            </View>
          </View>
          <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: modelsReady ? c.successDim : c.warningDim }}>
            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: modelsReady ? c.success : c.warning }}>
              {modelsReady ? 'ONLINE' : 'LOADING'}
            </Text>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[
            { label: "Today's Auth", value: todayCount, color: c.accent },
            { label: 'Verified', value: todayCount, color: c.success },
            { label: 'Synced', value: syncedCount, color: c.success },
            { label: 'Pending', value: pendingCount, color: c.warning },
          ].map(stat => (
            <View key={stat.label} style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: stat.color + '44', alignItems: 'center' }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: stat.color }}>{stat.value}</Text>
              <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Sync Card */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Cloud Sync Status</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: SYNC_COLOR[syncStatus] + '22' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, marginRight: 5, backgroundColor: SYNC_COLOR[syncStatus] }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: SYNC_COLOR[syncStatus] }}>{syncStatus}</Text>
            </View>
          </View>
          <Text style={{ color: c.textSub, fontSize: 12, marginBottom: 8 }}>{SYNC_LABEL[syncStatus]}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: c.textMuted, fontSize: 11 }}>Last sync: {lastSync}</Text>
            <Text style={{ color: c.textMuted, fontSize: 11 }}>Queue: {pendingCount} records</Text>
          </View>
        </View>

        {/* Primary Action */}
        <TouchableOpacity
          style={{ backgroundColor: c.accent, borderRadius: 16, padding: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: modelsReady ? 1 : 0.4 }}
          onPress={() => navigation.navigate('Auth')}
          disabled={!modelsReady}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 28, marginRight: 14 }}>🔐</Text>
            <View>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800' }}>Mark Attendance</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>Face recognition + liveness detection</Text>
            </View>
          </View>
          <Text style={{ color: '#FFF', fontSize: 28 }}>›</Text>
        </TouchableOpacity>

        {/* Secondary Actions */}
        {[
          [{ label: '👤 Enroll', sub: 'Add employee', screen: 'Enroll' }, { label: '📋 Logs', sub: 'Attendance history', screen: 'AttendanceLog' }],
          [{ label: '📊 Analytics', sub: 'Trends & stats', screen: 'Analytics' }, { label: '🛡️ Security', sub: 'Protection status', screen: 'Security' }],
        ].map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            {row.map(btn => (
              <TouchableOpacity
                key={btn.screen}
                style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}
                onPress={() => navigation.navigate(btn.screen as any)}
                activeOpacity={0.8}
              >
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>{btn.label}</Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>{btn.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* System Info */}
        <View style={{ backgroundColor: c.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, marginTop: 4 }}>
          <Text style={{ color: c.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 }}>SYSTEM SPECIFICATIONS</Text>
          {[
            ['Detection', 'BlazeFace ONNX INT8 • ~15ms'],
            ['Recognition', 'MobileFaceNet ArcFace • ~120ms'],
            ['Liveness', 'Passive texture + Active gesture'],
            ['Storage', 'AES-256-CBC encrypted SQLite'],
            ['Latency', '~460ms end-to-end • <1s guaranteed'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: c.textMuted, fontSize: 11 }}>{k}</Text>
              <Text style={{ color: c.textSub, fontSize: 11 }}>{v}</Text>
            </View>
          ))}
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}
