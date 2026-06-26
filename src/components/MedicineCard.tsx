import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { Medicine, Schedule } from '../types';

interface MedicineCardProps {
  medicine: Medicine;
  schedules: Schedule[];
  onPress: () => void;
}

const FORMAT_LABEL: Record<string, string> = {
  pill: '💊 Comprimido',
  liquid: '🧴 Líquido',
  drops: '💧 Gotas',
  injection: '💉 Injetável',
  other: '📦 Outro',
};

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, schedules, onPress }) => {
  const theme = useTheme();

  const sortedSchedules = [...schedules].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <TouchableOpacity
      onPress={onPress} 
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {medicine.name}
        </Text>
        {medicine.dosage ? (
          <Text style={[styles.dosage, { color: theme.colors.textSecondary }]}>{medicine.dosage}</Text>
        ) : null}
      </View>

      {medicine.format ? (
        <Text style={[styles.format, { color: theme.colors.textSecondary }]}>
          {FORMAT_LABEL[medicine.format] || medicine.format}
        </Text>
      ) : null}

      <View style={styles.schedulesList}>
        {sortedSchedules.map((s) => (
          <View key={s.id} style={[styles.scheduleRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.timeText, { color: theme.colors.primary }]}>{s.time}</Text>
            <Text style={[styles.daysText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {s.weekdays.map((d) => WEEKDAY_SHORT[d]).join(' · ')}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 8 },
  dosage: { fontSize: 14, fontWeight: '500' },
  format: { fontSize: 13, marginTop: 4 },
  schedulesList: { marginTop: 12, gap: 6 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, gap: 10 },
  timeText: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 52 },
  daysText: { fontSize: 12, flex: 1 },
});