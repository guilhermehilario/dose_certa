import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import type { MedicineDetailsProps } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { MedicineRepository } from '../../../database/repositories/MedicineRepository';
import { ScheduleRepository } from '../../../database/repositories/ScheduleRepository';
import type { Medicine, Schedule } from '../../../types';

const FORMAT_LABEL: Record<string, string> = {
  tablet: '💊 Comprimido',
  capsule: '💊 Cápsula',
  liquid: '🧴 Líquido',
  drops: '💧 Gotas',
  injection: '💉 Injetável',
  cream: '🧴 Creme',
  other: '📦 Outro',
};
const WEEKDAY_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const MedicineDetailsScreen: React.FC<MedicineDetailsProps> = ({ navigation, route }) => {
  const { medicineId } = route.params;
  const theme = useTheme();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const m = await MedicineRepository.findById(medicineId);
      if (!m) {
        Alert.alert('Erro', 'Remédio não encontrado.');
        navigation.goBack();
        return;
      }
      setMedicine(m);
      setSchedules(await ScheduleRepository.findByMedicineId(m.id));
    } finally {
      setLoading(false);
    }
  }, [medicineId, navigation]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = () => {
    Alert.alert(
      'Excluir remédio',
      `Deseja excluir "${medicine?.name}"? Todos os horários e doses associadas serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await MedicineRepository.delete(medicineId);
              navigation.popToTop();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o remédio.');
            }
          },
        },
      ],
    );
  };

  if (loading || !medicine) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const sortedSchedules = [...schedules].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.name, { color: theme.colors.text }]}>{medicine.name}</Text>
        {medicine.dosage ? <Text style={[styles.dosage, { color: theme.colors.primary }]}>{medicine.dosage}</Text> : null}
        {medicine.format ? <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>{FORMAT_LABEL[medicine.format]}</Text> : null}

        <View style={styles.divider} />

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Período</Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Início: {medicine.startDate ?? '—'}</Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>Fim: {medicine.endDate ?? 'Indeterminado'}</Text>
        {medicine.notes ? (
          <>
            <View style={styles.divider} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Observações</Text>
            <Text style={[styles.notes, { color: theme.colors.textSecondary }]}>{medicine.notes}</Text>
          </>
        ) : null}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Horários</Text>

      {sortedSchedules.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>Nenhum horário cadastrado.</Text>
      ) : (
        sortedSchedules.map((s) => (
          <View key={s.id} style={[styles.scheduleCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.scheduleTime, { color: theme.colors.primary }]}>{s.time}</Text>
            <Text style={[styles.scheduleDays, { color: theme.colors.textSecondary }]}>
              {s.weekdays.map((d) => WEEKDAY_FULL[d]).join(', ')}
            </Text>
          </View>
        ))
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MedicineForm', { medicineId })}
          style={[styles.btn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.btn, styles.btnDanger, { borderColor: theme.colors.danger }]}
        >
          <Text style={[styles.btnText, { color: theme.colors.danger }]}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 14, padding: 18, borderWidth: 1 },
  name: { fontSize: 24, fontWeight: '700' },
  dosage: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  meta: { fontSize: 14, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#00000010', marginVertical: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  notes: { fontSize: 14, lineHeight: 20 },
  empty: { fontSize: 14, fontStyle: 'italic', paddingVertical: 12 },
  scheduleCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  scheduleTime: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  scheduleDays: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  actions: { marginTop: 28, gap: 12 },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnDanger: { backgroundColor: 'transparent', borderWidth: 1.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});