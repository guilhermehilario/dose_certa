import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

interface TimePickerProps {
  visible: boolean;
  initialTime?: string; // HH:mm
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  visible, initialTime = '08:00', onConfirm, onCancel,
}) => {
  const theme = useTheme();
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (visible) {
      const [h, m] = initialTime.split(':').map(Number);
      setHour(h || 0);
      setMinute(m || 0);
    }
  }, [visible, initialTime]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const inc = (type: 'h' | 'm', delta: number) => {
    if (type === 'h') setHour((h) => (h + delta + 24) % 24);
    else setMinute((m) => (m + delta + 60) % 60);
  };

  const handleConfirm = () => onConfirm(`${pad(hour)}:${pad(minute)}`);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.box, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Selecionar horário</Text>

          <View style={styles.display}>
            <Text style={[styles.time, { color: theme.colors.primary }]}>
              {pad(hour)}:{pad(minute)}
            </Text>
          </View>

          <View style={styles.controls}>
            <View style={styles.col}>
              <TouchableOpacity onPress={() => inc('h', 1)} style={styles.btn}>
                <Text style={[styles.btnText, { color: theme.colors.primary }]}>▲</Text>
              </TouchableOpacity>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Hora</Text>
              <TouchableOpacity onPress={() => inc('h', -1)} style={styles.btn}>
                <Text style={[styles.btnText, { color: theme.colors.primary }]}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.col}>
              <TouchableOpacity onPress={() => inc('m', 1)} style={styles.btn}>
                <Text style={[styles.btnText, { color: theme.colors.primary }]}>▲</Text>
              </TouchableOpacity>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Minuto</Text>
              <TouchableOpacity onPress={() => inc('m', -1)} style={styles.btn}>
                <Text style={[styles.btnText, { color: theme.colors.primary }]}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={[styles.actionBtn, { borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  box: { borderRadius: 16, padding: 24 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  display: { alignItems: 'center', marginVertical: 16 },
  time: { fontSize: 56, fontWeight: '700', fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  col: { alignItems: 'center' },
  btn: { padding: 12 },
  btnText: { fontSize: 22, fontWeight: '600' },
  label: { fontSize: 12, marginVertical: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
});