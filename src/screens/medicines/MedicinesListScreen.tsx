import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { MedicineRepository } from '../../database/repositories/MedicineRepository';
import { ScheduleRepository } from '../../database/repositories/ScheduleRepository';
import { MedicineCard } from '../../components/MedicineCard';
import type { Medicine, Schedule, MedicinesStackParamList } from '../../types';

type Props = NativeStackScreenProps<MedicinesStackParamList, 'MedicinesList'>;

type ListItem = {
  id: string; // chave única para FlatList
  medicine: Medicine;
  schedules: Schedule[];
};

export const MedicinesListScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const medicines = await MedicineRepository.findAll();
      const withSchedules: ListItem[] = await Promise.all(
        medicines.map(async (m) => ({
          id: String(m.id),
          medicine: m,
          schedules: await ScheduleRepository.findByMedicineId(m.id),
        })),
      );
      setItems(withSchedules);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os remédios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Nenhum remédio cadastrado
            </Text>
            <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
              Toque no botão + para adicionar seu primeiro medicamento.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MedicineCard
            medicine={item.medicine}
            schedules={item.schedules}
            onPress={() => navigation.navigate('MedicineDetails', { medicineId: item.medicine.id })}
          />
        )}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('MedicineForm', {})}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '600', lineHeight: 32 },
});