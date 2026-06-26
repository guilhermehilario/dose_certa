import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import type { MedicineDetailsProps } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { globalStyles } from '../../../constants/globalStyles';
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
      <View style={[globalStyles.center, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const sortedSchedules = [...schedules].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <ScrollView style={[globalStyles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={globalStyles.content}>
      <View style={[globalStyles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[globalStyles.name, { color: theme.colors.text }]}>{medicine.name}</Text>
        {medicine.dosage ? <Text style={[globalStyles.dosage, { color: theme.colors.primary }]}>{medicine.dosage}</Text> : null}
        {medicine.format ? <Text style={[globalStyles.meta, { color: theme.colors.textSecondary }]}>{FORMAT_LABEL[medicine.format]}</Text> : null}

        <View style={globalStyles.divider} />

        <Text style={[globalStyles.sectionTitle, { color: theme.colors.text }]}>Período</Text>
        <Text style={[globalStyles.meta, { color: theme.colors.textSecondary }]}>Início: {medicine.startDate ?? '—'}</Text>
        <Text style={[globalStyles.meta, { color: theme.colors.textSecondary }]}>Fim: {medicine.endDate ?? 'Indeterminado'}</Text>
        {medicine.notes ? (
          <>
            <View style={globalStyles.divider} />
            <Text style={[globalStyles.sectionTitle, { color: theme.colors.text }]}>Observações</Text>
            <Text style={[globalStyles.notes, { color: theme.colors.textSecondary }]}>{medicine.notes}</Text>
          </>
        ) : null}
      </View>

      <Text style={[globalStyles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>Horários</Text>

      {sortedSchedules.length === 0 ? (
        <Text style={[globalStyles.empty, { color: theme.colors.textSecondary }]}>Nenhum horário cadastrado.</Text>
      ) : (
        sortedSchedules.map((s) => (
          <View key={s.id} style={[globalStyles.scheduleCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[globalStyles.scheduleTime, { color: theme.colors.primary }]}>{s.time}</Text>
            <Text style={[globalStyles.scheduleDays, { color: theme.colors.textSecondary }]}>
              {s.weekdays.map((d) => WEEKDAY_FULL[d]).join(', ')}
            </Text>
          </View>
        ))
      )}

      <View style={globalStyles.actions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MedicineForm', { medicineId })}
          style={[globalStyles.btn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={globalStyles.btnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={[globalStyles.btn, globalStyles.btnDanger, { borderColor: theme.colors.danger }]}
        >
          <Text style={[globalStyles.btnText, { color: theme.colors.danger }]}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
