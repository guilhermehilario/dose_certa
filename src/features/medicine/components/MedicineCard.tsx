import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { globalStyles } from '../../../constants/globalStyles';
import type { Medicine, Schedule } from '../../../types';

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
      style={[globalStyles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={globalStyles.header}>
        <Text style={[globalStyles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {medicine.name}
        </Text>
        {medicine.dosage ? (
          <Text style={[globalStyles.dosage, { color: theme.colors.textSecondary }]}>{medicine.dosage}</Text>
        ) : null}
      </View>

      {medicine.format ? (
        <Text style={[globalStyles.format, { color: theme.colors.textSecondary }]}>
          {FORMAT_LABEL[medicine.format] || medicine.format}
        </Text>
      ) : null}

      <View style={globalStyles.schedulesList}>
        {sortedSchedules.map((s) => (
          <View key={s.id} style={[globalStyles.scheduleRow, { backgroundColor: theme.colors.background }]}>
            <Text style={[globalStyles.timeText, { color: theme.colors.primary }]}>{s.time}</Text>
            <Text style={[globalStyles.daysText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {s.weekdays.map((d) => WEEKDAY_SHORT[d]).join(' · ')}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

