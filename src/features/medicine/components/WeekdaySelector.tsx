import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

const DAYS = [
  { key: 0, label: 'D' }, // domingo
  { key: 1, label: 'S' },
  { key: 2, label: 'T' },
  { key: 3, label: 'Q' },
  { key: 4, label: 'Q' },
  { key: 5, label: 'S' },
  { key: 6, label: 'S' },
];

interface WeekdaySelectorProps {
  selected: number[]; // 0-6
  onChange: (days: number[]) => void;
  error?: string;
}

export const WeekdaySelector: React.FC<WeekdaySelectorProps> = ({ selected, onChange, error }) => {
  const theme = useTheme();

  const toggle = (day: number) => {
    if (selected.includes(day)) onChange(selected.filter((d) => d !== day));
    else onChange([...selected, day].sort());
  };

  return (
    <View>
      <View style={styles.row}>
        {DAYS.map((d) => {
          const active = selected.includes(d.key);
          return (
            <TouchableOpacity
              key={d.key}
              onPress={() => toggle(d.key)}
              style={[
                styles.day,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text style={{ color: active ? '#fff' : theme.colors.text, fontWeight: '600' }}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  day: { flex: 1, aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  error: { fontSize: 12, marginTop: 6 },
});