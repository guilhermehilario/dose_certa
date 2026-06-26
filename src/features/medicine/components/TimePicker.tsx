import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, Pressable,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { globalStyles } from '../../../constants/globalStyles';

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
      <Pressable style={globalStyles.overlay} onPress={onCancel}>
        <Pressable style={[globalStyles.box, { backgroundColor: theme.colors.surface }]}>
          <Text style={[globalStyles.titleSmall, { color: theme.colors.text }]}>Selecionar horário</Text>

          <View style={globalStyles.display}>
            <Text style={[globalStyles.time, { color: theme.colors.primary }]}>
              {pad(hour)}:{pad(minute)}
            </Text>
          </View>

          <View style={globalStyles.controls}>
            <View style={globalStyles.col}>
              <TouchableOpacity onPress={() => inc('h', 1)} style={globalStyles.btnSmall}>
                <Text style={[globalStyles.btnTextSmall, { color: theme.colors.primary }]}>▲</Text>
              </TouchableOpacity>
              <Text style={[globalStyles.label, { color: theme.colors.textSecondary }]}>Hora</Text>
              <TouchableOpacity onPress={() => inc('h', -1)} style={globalStyles.btnSmall}>
                <Text style={[globalStyles.btnTextSmall, { color: theme.colors.primary }]}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={globalStyles.col}>
              <TouchableOpacity onPress={() => inc('m', 1)} style={globalStyles.btnSmall}>
                <Text style={[globalStyles.btnTextSmall, { color: theme.colors.primary }]}>▲</Text>
              </TouchableOpacity>
              <Text style={[globalStyles.label, { color: theme.colors.textSecondary }]}>Minuto</Text>
              <TouchableOpacity onPress={() => inc('m', -1)} style={globalStyles.btnSmall}>
                <Text style={[globalStyles.btnTextSmall, { color: theme.colors.primary }]}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={globalStyles.actions}>
            <TouchableOpacity onPress={onCancel} style={[globalStyles.actionBtn, { borderColor: theme.colors.border }]}> 
              <Text style={{ color: theme.colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={[globalStyles.actionBtn, { backgroundColor: theme.colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
