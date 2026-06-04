import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, SafeAreaView, TouchableOpacity,
  RefreshControl, TextInput, StatusBar,
} from 'react-native';
import { getRecentAttendance, AttendanceLog } from '../services/Database';
import { triggerSync } from '../services/SyncService';
import { useTheme } from '../context/ThemeContext';

type Filter = 'ALL' | 'SYNCED' | 'PENDING';

export default function AttendanceLogScreen() {
  const { colors: c, theme } = useTheme();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [filtered, setFiltered] = useState<AttendanceLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const data = await getRecentAttendance(200);
    setLogs(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let data = logs;
    if (filter === 'SYNCED') data = data.filter(l => l.synced);
    if (filter === 'PENDING') data = data.filter(l => !l.synced);
    if (search.trim()) data = data.filter(l => l.employeeName.toLowerCase().includes(search.toLowerCase()));
    setFiltered(data);
  }, [logs, filter, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setSyncing(true);
    await triggerSync(); await load();
    setRefreshing(false); setSyncing(false);
  }, [load]);

  const pendingCount = logs.filter(l => !l.synced).length;
  const syncedCount = logs.filter(l => l.synced).length;

  const renderItem = ({ item }: { item: AttendanceLog }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.bgCard, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: c.border }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.accentDim, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>{item.employeeName.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{item.employeeName}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
      <View style={{ backgroundColor: item.synced ? c.successDim : c.warningDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
        <Text style={{ color: item.synced ? c.success : c.warning, fontSize: 11, fontWeight: '700' }}>
          {item.synced ? '✓ Synced' : '⏳ Pending'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
        ListHeaderComponent={
          <View>
            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Total', value: logs.length, color: c.accent },
                { label: 'Synced', value: syncedCount, color: c.success },
                { label: 'Pending', value: pendingCount, color: c.warning },
              ].map(s => (
                <View key={s.label} style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: s.color + '44' }}>
                  <Text style={{ color: s.color, fontSize: 22, fontWeight: '800' }}>{s.value}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Sync Button */}
            <TouchableOpacity
              style={{ backgroundColor: syncing ? c.bgCard : c.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: c.border }}
              onPress={onRefresh} disabled={syncing}
            >
              <Text style={{ color: syncing ? c.textMuted : '#FFF', fontSize: 14, fontWeight: '700' }}>
                {syncing ? '⟳ Syncing…' : '↑ Sync to Cloud'}
              </Text>
            </TouchableOpacity>

            {/* Search */}
            <TextInput
              style={{ backgroundColor: c.bgCard, borderRadius: 12, borderWidth: 1, borderColor: c.border, color: c.text, fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 }}
              placeholder="Search employee…"
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={setSearch}
            />

            {/* Filters */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {(['ALL', 'SYNCED', 'PENDING'] as Filter[]).map(f => (
                <TouchableOpacity
                  key={f}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: filter === f ? c.accent : c.bgCard, borderWidth: 1, borderColor: filter === f ? c.accent : c.border }}
                  onPress={() => setFilter(f)}
                >
                  <Text style={{ color: filter === f ? '#FFF' : c.textSub, fontSize: 12, fontWeight: '700' }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
            <Text style={{ color: c.textMuted, fontSize: 15 }}>No attendance records yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
