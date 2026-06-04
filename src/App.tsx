import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, StatusBar, Animated, TextInput, FlatList,
  Dimensions, Platform,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:       '#040C18',
  card:     '#0A1628',
  card2:    '#0F1E35',
  border:   '#162844',
  blue:     '#3B82F6',
  blueGlow: '#1D4ED8',
  cyan:     '#06B6D4',
  green:    '#10B981',
  amber:    '#F59E0B',
  red:      '#EF4444',
  white:    '#F8FAFC',
  grey:     '#64748B',
  dim:      '#1E3A5F',
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_LOGS = [
  { id: '1', name: 'Rajesh Kumar',      code: 'NHAI-0041', time: '08:12 AM', conf: 97.3, synced: true  },
  { id: '2', name: 'Priya Sharma',      code: 'NHAI-0067', time: '08:34 AM', conf: 94.8, synced: true  },
  { id: '3', name: 'Amit Patel',        code: 'NHAI-0023', time: '09:05 AM', conf: 96.1, synced: false },
  { id: '4', name: 'Sunita Rao',        code: 'NHAI-0089', time: '09:22 AM', conf: 98.2, synced: false },
  { id: '5', name: 'Vikram Singh',      code: 'NHAI-0055', time: '09:41 AM', conf: 93.7, synced: false },
  { id: '6', name: 'Meena Krishnan',    code: 'NHAI-0031', time: '10:03 AM', conf: 95.5, synced: true  },
  { id: '7', name: 'Deepak Verma',      code: 'NHAI-0074', time: '10:28 AM', conf: 97.9, synced: false },
  { id: '8', name: 'Lakshmi Nair',      code: 'NHAI-0018', time: '10:45 AM', conf: 96.6, synced: false },
];

const CHALLENGES = ['👁  Blink twice', '😊  Smile', '↩  Turn head left', '↪  Turn head right'];
const EMPLOYEES  = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Rao', 'Vikram Singh'];

type Screen = 'home' | 'auth' | 'enroll' | 'log';

// ─── Animated pulsing ring ────────────────────────────────────────────────────
function PulseRing({ color, size }: { color: string; size: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2,
      borderWidth: 2, borderColor: color,
      transform: [{ scale }], opacity,
    }} />
  );
}

// ─── Typing counter ───────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.floor(to / 40));
    const t = setInterval(() => {
      current = Math.min(current + step, to);
      setVal(current);
      if (current >= to) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <Text style={styles.counterNum}>{val}{suffix}</Text>;
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ navigate, stats }: { navigate: (s: Screen) => void; stats: any }) {
  const [time, setTime] = useState(new Date());
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
    return () => clearInterval(t);
  }, []);

  const glowColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.45)'],
  });

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <PulseRing color={C.blue} size={120} />
          <PulseRing color={C.cyan} size={90} />
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>N</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>NHAI</Text>
        <Text style={styles.heroSub}>Secure Field Authentication</Text>
        <Text style={styles.clock}>{timeStr}</Text>
      </View>

      {/* Status badges */}
      <View style={styles.badgeRow}>
        {[
          { icon: '🟢', label: 'AI Ready' },
          { icon: '🔒', label: 'AES-256' },
          { icon: '📡', label: 'Offline' },
        ].map(b => (
          <View key={b.label} style={styles.badge}>
            <Text style={styles.badgeIcon}>{b.icon}</Text>
            <Text style={styles.badgeLabel}>{b.label}</Text>
          </View>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Counter to={stats.verified} />
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Counter to={stats.pending} />
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Counter to={7} suffix=" MB" />
          <Text style={styles.statLabel}>Model Size</Text>
        </View>
        <View style={styles.statCard}>
          <Counter to={600} suffix="ms" />
          <Text style={styles.statLabel}>Latency</Text>
        </View>
      </View>

      {/* Main CTA */}
      <Animated.View style={[styles.glowWrap, { shadowColor: glowColor as any }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigate('auth')} activeOpacity={0.85}>
          <Text style={styles.primaryBtnIcon}>👤</Text>
          <View>
            <Text style={styles.primaryBtnText}>Mark Attendance</Text>
            <Text style={styles.primaryBtnSub}>Face recognition + liveness check</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.secRow}>
        <TouchableOpacity style={styles.secBtn} onPress={() => navigate('enroll')} activeOpacity={0.85}>
          <Text style={styles.secBtnIcon}>➕</Text>
          <Text style={styles.secBtnText}>Enrol Employee</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secBtn} onPress={() => navigate('log')} activeOpacity={0.85}>
          <Text style={styles.secBtnIcon}>📋</Text>
          <Text style={styles.secBtnText}>View Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Tech info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>SYSTEM OVERVIEW</Text>
        <View style={styles.infoRow}><Text style={styles.infoKey}>Face Detection</Text><Text style={styles.infoVal}>BlazeFace · ~1 MB</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoKey}>Recognition</Text><Text style={styles.infoVal}>MobileFaceNet ArcFace · ~4 MB</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoKey}>Liveness</Text><Text style={styles.infoVal}>Passive texture + Active gesture</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoKey}>Storage</Text><Text style={styles.infoVal}>AES-256 encrypted SQLite</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoKey}>Sync</Text><Text style={styles.infoVal}>AWS API Gateway + Lambda</Text></View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}><Text style={styles.infoKey}>Accuracy</Text><Text style={[styles.infoVal, { color: C.green }]}>&gt;95% on Indian demographics</Text></View>
      </View>
    </ScrollView>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
type AuthPhase = 'idle' | 'detecting' | 'passive' | 'challenge' | 'recognising' | 'success' | 'failed';

function AuthScreen({ onSuccess }: { onSuccess: (name: string, conf: number) => void }) {
  const [phase, setPhase]         = useState<AuthPhase>('idle');
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [challenges, setChallenges]     = useState<string[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<boolean[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [confidence, setConfidence] = useState(0);
  const [resultName, setResultName] = useState('');
  const [failReason, setFailReason] = useState('');
  const ovalAnim   = useRef(new Animated.Value(0)).current;
  const confAnim   = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const ovalBorderColor = ovalAnim.interpolate({
    inputRange: [0, 1], outputRange: [C.blue, C.green],
  });

  const startAuth = useCallback(() => {
    const picked = [...CHALLENGES].sort(() => Math.random() - 0.5).slice(0, 2);
    setChallenges(picked);
    setCompletedChallenges([false, false]);
    setChallengeIdx(0);
    setConfidence(0);
    setPhase('detecting');

    setTimeout(() => setPhase('passive'), 1500);
    setTimeout(() => setPhase('challenge'), 2800);
  }, []);

  useEffect(() => {
    if (phase === 'challenge') {
      setCountdown(3);
      const tick = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(tick);
            handleChallengePass();
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(tick);
    }
  }, [phase, challengeIdx]);

  const handleChallengePass = useCallback(() => {
    setCompletedChallenges(prev => {
      const next = [...prev];
      next[challengeIdx] = true;
      return next;
    });

    Animated.timing(ovalAnim, { toValue: challengeIdx === 0 ? 0.5 : 1, duration: 400, useNativeDriver: false }).start();

    if (challengeIdx < challenges.length - 1) {
      setChallengeIdx(prev => prev + 1);
      setCountdown(3);
    } else {
      setPhase('recognising');
      const finalConf = 93 + Math.random() * 5;
      Animated.timing(confAnim, { toValue: finalConf, duration: 1800, useNativeDriver: false }).start();
      confAnim.addListener(({ value }) => setConfidence(Math.floor(value)));

      setTimeout(() => {
        const name = EMPLOYEES[Math.floor(Math.random() * EMPLOYEES.length)];
        setResultName(name);
        setConfidence(Math.floor(finalConf));
        setPhase('success');
        Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }).start();
        onSuccess(name, Math.floor(finalConf));
      }, 2200);
    }
  }, [challengeIdx, challenges]);

  const reset = () => {
    setPhase('idle');
    setConfidence(0);
    ovalAnim.setValue(0);
    confAnim.setValue(0);
    successAnim.setValue(0);
  };

  const PHASE_STEPS = ['Detecting', 'Liveness', 'Recognising', 'Done'];
  const PHASE_IDX: Record<AuthPhase, number> = {
    idle: -1, detecting: 0, passive: 0, challenge: 1, recognising: 2, success: 3, failed: -1,
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
      <Text style={styles.screenTitle}>Face Authentication</Text>

      {/* Step bar */}
      {phase !== 'idle' && phase !== 'failed' && (
        <View style={styles.stepBar}>
          {PHASE_STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, i <= PHASE_IDX[phase] && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, i <= PHASE_IDX[phase] && { color: C.white }]}>
                  {i < PHASE_IDX[phase] ? '✓' : i + 1}
                </Text>
              </View>
              {i < PHASE_STEPS.length - 1 && (
                <View style={[styles.stepLine, i < PHASE_IDX[phase] && styles.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Face oval */}
      <View style={styles.ovalContainer}>
        <Animated.View style={[styles.oval, { borderColor: ovalBorderColor }]}>
          {(phase === 'idle') && <Text style={styles.ovalPlaceholder}>👤</Text>}
          {phase === 'detecting' && <Text style={styles.ovalStatus}>Detecting face…</Text>}
          {phase === 'passive'   && <Text style={styles.ovalStatus}>Checking liveness…</Text>}
          {phase === 'recognising' && (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.confNum}>{confidence}%</Text>
              <Text style={styles.ovalStatus}>Matching…</Text>
            </View>
          )}
          {phase === 'success' && (
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: successAnim }] }}>
              <Text style={{ fontSize: 52 }}>✅</Text>
            </Animated.View>
          )}
          {phase === 'failed' && <Text style={{ fontSize: 52 }}>❌</Text>}
        </Animated.View>
        {(phase === 'detecting' || phase === 'passive') && (
          <View style={styles.scanLine} />
        )}
      </View>

      {/* Challenge card */}
      {phase === 'challenge' && challenges.length > 0 && (
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>Liveness Challenge {challengeIdx + 1}/{challenges.length}</Text>
          <Text style={styles.challengeText}>{challenges[challengeIdx]}</Text>
          <View style={styles.countdownRow}>
            {[3, 2, 1].map(n => (
              <View key={n} style={[styles.countdownDot, countdown === n && styles.countdownDotActive]}>
                <Text style={[styles.countdownNum, countdown === n && { color: C.white }]}>{n}</Text>
              </View>
            ))}
          </View>
          <View style={styles.challengeDotsRow}>
            {challenges.map((_, i) => (
              <View key={i} style={[styles.chDot, completedChallenges[i] && styles.chDotDone]} />
            ))}
          </View>
          <TouchableOpacity style={styles.manualBtn} onPress={handleChallengePass}>
            <Text style={styles.manualBtnText}>✓  Complete Challenge</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success card */}
      {phase === 'success' && (
        <Animated.View style={[styles.resultCard, styles.successCard, { transform: [{ scale: successAnim }] }]}>
          <Text style={styles.resultCardTitle}>Authentication Successful</Text>
          <Text style={styles.resultName}>{resultName}</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultKey}>Confidence</Text>
            <Text style={[styles.resultVal, { color: C.green }]}>{confidence}%</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultKey}>Timestamp</Text>
            <Text style={styles.resultVal}>{new Date().toLocaleTimeString()}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultKey}>Storage</Text>
            <Text style={[styles.resultVal, { color: C.amber }]}>🔒 Encrypted locally</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultKey}>Sync</Text>
            <Text style={[styles.resultVal, { color: C.grey }]}>Queued for AWS upload</Text>
          </View>
          <TouchableOpacity style={[styles.manualBtn, { backgroundColor: C.green, marginTop: 16 }]} onPress={reset}>
            <Text style={styles.manualBtnText}>New Authentication</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Idle start */}
      {phase === 'idle' && (
        <TouchableOpacity style={styles.primaryBtn} onPress={startAuth}>
          <Text style={styles.primaryBtnIcon}>🔍</Text>
          <View>
            <Text style={styles.primaryBtnText}>Start Authentication</Text>
            <Text style={styles.primaryBtnSub}>Liveness + face recognition</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Status text */}
      {(phase === 'detecting' || phase === 'passive' || phase === 'recognising') && (
        <View style={styles.statusPill}>
          <View style={styles.spinnerDot} />
          <Text style={styles.statusPillText}>
            {phase === 'detecting'   ? 'Scanning for face…'        :
             phase === 'passive'     ? 'Passive anti-spoof check…' :
                                       `Matching · ${confidence}% confidence`}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── ENROLL ───────────────────────────────────────────────────────────────────
function EnrollScreen({ onEnroll }: { onEnroll: (name: string, code: string) => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'form' | 'capturing' | 'processing' | 'done'>('form');
  const [captureFrame, setCaptureFrame] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const dotAnims = useRef([0,1,2,3,4].map(() => new Animated.Value(0))).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const startCapture = () => {
    setPhase('capturing');
    setCaptureFrame(0);
    const msgs = [
      'Detecting face…',
      'Capturing frame 1/5…',
      'Capturing frame 2/5…',
      'Capturing frame 3/5…',
      'Capturing frame 4/5…',
      'Capturing frame 5/5…',
      'Generating AES-256 embedding…',
      'Encrypting biometric data…',
      'Saving to secure local store…',
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < 5) {
        setStatusMsg(msgs[i + 1]);
        setCaptureFrame(i + 1);
        Animated.spring(dotAnims[i], { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }).start();
      } else if (i < msgs.length - 1) {
        setStatusMsg(msgs[i + 1]);
        if (i === 5) setPhase('processing');
      } else {
        clearInterval(interval);
        setPhase('done');
        onEnroll(name.trim(), code.trim());
        Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 6 }).start();
      }
      i++;
    }, 1200);
    setStatusMsg(msgs[0]);
  };

  const reset = () => {
    setPhase('form');
    setName('');
    setCode('');
    setCaptureFrame(0);
    dotAnims.forEach(a => a.setValue(0));
    checkAnim.setValue(0);
  };

  if (phase === 'done') {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View style={{ alignItems: 'center', transform: [{ scale: checkAnim }] }}>
          <View style={styles.successCircle}>
            <Text style={{ fontSize: 52 }}>✅</Text>
          </View>
          <Text style={styles.screenTitle}>Enrolled!</Text>
          <Text style={styles.enrolledName}>{name}</Text>
          <Text style={styles.enrolledCode}>{code}</Text>
          <View style={styles.encryptBadge}>
            <Text style={styles.encryptBadgeText}>🔒 AES-256 embedding saved</Text>
          </View>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={reset}>
            <Text style={styles.primaryBtnIcon}>➕</Text>
            <View>
              <Text style={styles.primaryBtnText}>Enrol Another</Text>
              <Text style={styles.primaryBtnSub}>Add more employees</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.screenTitle}>Enrol Employee</Text>

      {phase === 'form' && (
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rajesh Kumar"
            placeholderTextColor={C.grey}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Text style={styles.formLabel}>Employee Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. NHAI-0042"
            placeholderTextColor={C.grey}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
          <Text style={styles.formHint}>
            Face capture takes ~8 seconds. No photo is stored — only an AES-256
            encrypted 512-dimensional embedding vector.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, (!name.trim() || !code.trim()) && { opacity: 0.4 }]}
            onPress={startCapture}
            disabled={!name.trim() || !code.trim()}
          >
            <Text style={styles.primaryBtnIcon}>📸</Text>
            <View>
              <Text style={styles.primaryBtnText}>Capture Face</Text>
              <Text style={styles.primaryBtnSub}>5 frames · auto-capture</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {(phase === 'capturing' || phase === 'processing') && (
        <View style={styles.captureCard}>
          <View style={styles.captureOval}>
            <Text style={{ fontSize: 40 }}>👤</Text>
            {phase === 'processing' && (
              <View style={styles.processingOverlay}>
                <Text style={{ fontSize: 28 }}>⚙️</Text>
              </View>
            )}
          </View>

          <View style={styles.dotsRow}>
            {dotAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.captureDot,
                  { transform: [{ scale: anim }], opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                  i < captureFrame && styles.captureDotFill,
                ]}
              />
            ))}
          </View>

          <Text style={styles.captureStatus}>{statusMsg}</Text>
          <Text style={styles.captureFrameCount}>{captureFrame}/5 frames</Text>

          {phase === 'processing' && (
            <View style={styles.processingPill}>
              <Text style={styles.processingPillText}>🔒 Generating encrypted embedding…</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── LOG ──────────────────────────────────────────────────────────────────────
function LogScreen({ logs }: { logs: typeof MOCK_LOGS }) {
  const [syncedIds, setSyncedIds] = useState<Set<string>>(
    new Set(logs.filter(l => l.synced).map(l => l.id))
  );
  const [syncing, setSyncing] = useState(false);

  const syncAll = () => {
    setSyncing(true);
    const unsyncedIds = logs.filter(l => !syncedIds.has(l.id)).map(l => l.id);
    unsyncedIds.forEach((id, i) => {
      setTimeout(() => {
        setSyncedIds(prev => new Set([...prev, id]));
        if (i === unsyncedIds.length - 1) setSyncing(false);
      }, (i + 1) * 600);
    });
  };

  const pending = logs.length - syncedIds.size;

  return (
    <View style={[styles.screen, { flex: 1 }]}>
      <Text style={styles.screenTitle}>Attendance Log</Text>

      <View style={styles.logHeader}>
        <View style={styles.logStat}>
          <Text style={styles.logStatNum}>{logs.length}</Text>
          <Text style={styles.logStatLabel}>Total</Text>
        </View>
        <View style={styles.logStat}>
          <Text style={[styles.logStatNum, { color: C.green }]}>{syncedIds.size}</Text>
          <Text style={styles.logStatLabel}>Synced</Text>
        </View>
        <View style={styles.logStat}>
          <Text style={[styles.logStatNum, { color: C.amber }]}>{pending}</Text>
          <Text style={styles.logStatLabel}>Pending</Text>
        </View>
        <TouchableOpacity
          style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
          onPress={syncAll}
          disabled={syncing || pending === 0}
        >
          <Text style={styles.syncBtnText}>{syncing ? 'Syncing…' : '☁  Sync All'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const isSynced = syncedIds.has(item.id);
          return (
            <View style={styles.logRow}>
              <View style={styles.logAvatar}>
                <Text style={styles.logAvatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logName}>{item.name}</Text>
                <Text style={styles.logCode}>{item.code} · {item.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.logConf, { color: item.conf >= 96 ? C.green : C.blue }]}>
                  {item.conf.toFixed(1)}%
                </Text>
                <View style={[styles.syncBadge, { backgroundColor: isSynced ? '#052E1C' : '#2D1B00' }]}>
                  <Text style={[styles.syncBadgeText, { color: isSynced ? C.green : C.amber }]}>
                    {isSynced ? '✓ Synced' : '⏳ Pending'}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [stats, setStats] = useState({ verified: 6, pending: 2 });

  const handleAuthSuccess = (name: string, conf: number) => {
    const newLog = {
      id: Date.now().toString(),
      name, code: `NHAI-${String(Math.floor(Math.random() * 900 + 100))}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      conf, synced: false,
    };
    setLogs(prev => [newLog, ...prev]);
    setStats(prev => ({ verified: prev.verified + 1, pending: prev.pending + 1 }));
  };

  const handleEnroll = (name: string, code: string) => {
    // Enrolled employee stored in memory
  };

  const tabs: { key: Screen; icon: string; label: string }[] = [
    { key: 'home',   icon: '🏠', label: 'Home'   },
    { key: 'auth',   icon: '👤', label: 'Auth'   },
    { key: 'enroll', icon: '➕', label: 'Enroll' },
    { key: 'log',    icon: '📋', label: 'Log'    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>NHAI Face Auth</Text>
          <Text style={styles.headerSub}>Offline · Secure · Edge AI</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>v1.0</Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {screen === 'home'   && <HomeScreen navigate={setScreen} stats={stats} />}
        {screen === 'auth'   && <AuthScreen onSuccess={handleAuthSuccess} />}
        {screen === 'enroll' && <EnrollScreen onEnroll={handleEnroll} />}
        {screen === 'log'    && <LogScreen logs={logs} />}
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, screen === t.key && styles.tabActive]}
            onPress={() => setScreen(t.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabLabel, screen === t.key && { color: C.blue }]}>{t.label}</Text>
            {screen === t.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  screen:       { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16 },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:  { color: C.white, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  headerSub:    { color: C.grey, fontSize: 11, marginTop: 1 },
  headerBadge:  { backgroundColor: C.dim, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  headerBadgeText: { color: C.blue, fontSize: 11, fontWeight: '700' },

  // Tab bar
  tabBar:       { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Platform.OS === 'ios' ? 16 : 4 },
  tab:          { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 6, position: 'relative' },
  tabActive:    { backgroundColor: 'rgba(59,130,246,0.06)' },
  tabIcon:      { fontSize: 20 },
  tabLabel:     { color: C.grey, fontSize: 10, marginTop: 2, fontWeight: '600' },
  tabIndicator: { position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, backgroundColor: C.blue, borderRadius: 1 },

  // Home hero
  hero:         { alignItems: 'center', paddingTop: 28, paddingBottom: 20 },
  logoWrap:     { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoCircle:   { width: 72, height: 72, borderRadius: 36, backgroundColor: C.dim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.blue },
  logoText:     { color: C.white, fontSize: 32, fontWeight: '900' },
  heroTitle:    { color: C.white, fontSize: 34, fontWeight: '900', letterSpacing: 6 },
  heroSub:      { color: C.grey, fontSize: 12, letterSpacing: 2, marginTop: 4 },
  clock:        { color: C.blue, fontSize: 22, fontWeight: '700', marginTop: 10, fontVariant: ['tabular-nums'] },

  // Badges
  badgeRow:     { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  badge:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border, gap: 4 },
  badgeIcon:    { fontSize: 12 },
  badgeLabel:   { color: C.white, fontSize: 11, fontWeight: '600' },

  // Stats
  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard:     { flex: 1, backgroundColor: C.card2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  counterNum:   { color: C.white, fontSize: 18, fontWeight: '800' },
  statLabel:    { color: C.grey, fontSize: 10, marginTop: 2 },

  // Buttons
  glowWrap:     { width: '100%', shadowOffset: { width: 0, height: 0 }, shadowRadius: 20, shadowOpacity: 1, marginBottom: 12 },
  primaryBtn:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.blue, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, gap: 14, width: '100%' },
  primaryBtnIcon: { fontSize: 26 },
  primaryBtnText: { color: C.white, fontSize: 17, fontWeight: '800' },
  primaryBtnSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  secRow:       { flexDirection: 'row', gap: 10, marginBottom: 20 },
  secBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.card2, borderRadius: 12, paddingVertical: 14, gap: 8, borderWidth: 1, borderColor: C.border },
  secBtnIcon:   { fontSize: 18 },
  secBtnText:   { color: C.white, fontSize: 13, fontWeight: '600' },

  // Info card
  infoCard:     { backgroundColor: C.card2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  infoTitle:    { color: C.blue, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  infoKey:      { color: C.grey, fontSize: 12 },
  infoVal:      { color: C.white, fontSize: 12, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  // Auth
  screenTitle:  { color: C.white, fontSize: 22, fontWeight: '800', marginVertical: 16, textAlign: 'center' },
  stepBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, width: '80%' },
  stepDot:      { width: 28, height: 28, borderRadius: 14, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: C.blue, borderColor: C.blue },
  stepDotText:  { color: C.grey, fontSize: 11, fontWeight: '700' },
  stepLine:     { flex: 1, height: 2, backgroundColor: C.border },
  stepLineActive: { backgroundColor: C.blue },
  ovalContainer: { width: 220, height: 280, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  oval:         { width: 200, height: 260, borderRadius: 120, borderWidth: 3, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ovalPlaceholder: { fontSize: 72, opacity: 0.3 },
  ovalStatus:   { color: C.blue, fontSize: 13, fontWeight: '600', textAlign: 'center', paddingHorizontal: 16 },
  confNum:      { color: C.white, fontSize: 36, fontWeight: '900' },
  scanLine:     { position: 'absolute', width: 180, height: 2, backgroundColor: C.cyan, opacity: 0.6, top: '40%' },
  challengeCard: { width: '100%', backgroundColor: C.card2, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.blue, marginBottom: 16, alignItems: 'center' },
  challengeTitle: { color: C.grey, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  challengeText: { color: C.white, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  countdownRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  countdownDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.card, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  countdownDotActive: { borderColor: C.blue, backgroundColor: C.blue },
  countdownNum: { color: C.grey, fontSize: 14, fontWeight: '800' },
  challengeDotsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border },
  chDotDone:    { backgroundColor: C.green },
  manualBtn:    { backgroundColor: C.blueGlow, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, width: '100%', alignItems: 'center' },
  manualBtnText: { color: C.white, fontSize: 14, fontWeight: '700' },
  resultCard:   { width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, marginTop: 8 },
  successCard:  { backgroundColor: '#031A0E', borderColor: C.green },
  resultCardTitle: { color: C.green, fontSize: 16, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  resultName:   { color: C.white, fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 16 },
  resultRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  resultKey:    { color: C.grey, fontSize: 13 },
  resultVal:    { color: C.white, fontSize: 13, fontWeight: '600' },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  spinnerDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue },
  statusPillText: { color: C.blue, fontSize: 13, fontWeight: '600' },

  // Enroll
  formCard:     { backgroundColor: C.card2, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border, marginTop: 8 },
  formLabel:    { color: C.grey, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input:        { backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.white, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  formHint:     { color: C.grey, fontSize: 11, lineHeight: 16, marginVertical: 12 },
  captureCard:  { backgroundColor: C.card2, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.border, alignItems: 'center', marginTop: 8 },
  captureOval:  { width: 140, height: 180, borderRadius: 80, borderWidth: 2, borderColor: C.blue, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' },
  processingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 80, backgroundColor: 'rgba(10,22,40,0.7)', alignItems: 'center', justifyContent: 'center' },
  dotsRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  captureDot:   { width: 14, height: 14, borderRadius: 7, backgroundColor: C.border },
  captureDotFill: { backgroundColor: C.blue },
  captureStatus: { color: C.blue, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  captureFrameCount: { color: C.grey, fontSize: 12 },
  processingPill: { backgroundColor: '#1A2D1A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginTop: 12 },
  processingPillText: { color: C.green, fontSize: 12, fontWeight: '600' },
  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#031A0E', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: C.green },
  enrolledName: { color: C.white, fontSize: 22, fontWeight: '800', marginTop: 4 },
  enrolledCode: { color: C.grey, fontSize: 14, marginTop: 4, marginBottom: 12 },
  encryptBadge: { backgroundColor: '#1A2D1A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  encryptBadgeText: { color: C.green, fontSize: 12, fontWeight: '600' },

  // Log
  logHeader:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.card2, borderBottomWidth: 1, borderBottomColor: C.border, gap: 8 },
  logStat:      { alignItems: 'center', marginRight: 4 },
  logStatNum:   { color: C.white, fontSize: 18, fontWeight: '800' },
  logStatLabel: { color: C.grey, fontSize: 10 },
  syncBtn:      { marginLeft: 'auto' as any, backgroundColor: C.blue, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  syncBtnText:  { color: C.white, fontSize: 12, fontWeight: '700' },
  logRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border, gap: 12 },
  logAvatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor: C.dim, alignItems: 'center', justifyContent: 'center' },
  logAvatarText: { color: C.white, fontSize: 16, fontWeight: '800' },
  logName:      { color: C.white, fontSize: 14, fontWeight: '700' },
  logCode:      { color: C.grey, fontSize: 11, marginTop: 2 },
  logConf:      { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  syncBadge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  syncBadgeText: { fontSize: 11, fontWeight: '700' },
});