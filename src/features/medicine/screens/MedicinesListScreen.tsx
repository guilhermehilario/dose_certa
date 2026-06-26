import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../../contexts/ThemeContext';
import { MedicineRepository } from '../../../database/repositories/MedicineRepository';
import { ScheduleRepository } from '../../../database/repositories/ScheduleRepository';
import { MedicineCard } from '../components/MedicineCard';
import { globalStyles } from '../../../constants/globalStyles';
import type { Medicine, Schedule, MedicinesStackParamList } from '../../../types';

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
    <View style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={globalStyles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <View style={globalStyles.empty}>
            <Text style={globalStyles.emptyIcon}>💊</Text>
            <Text style={[globalStyles.emptyTitle, { color: theme.colors.text }]}>Nenhum remédio cadastrado</Text>
            <Text style={[globalStyles.emptySub, { color: theme.colors.textSecondary }]}>Toque no botão + para adicionar seu primeiro medicamento.</Text>
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
        style={[globalStyles.fab, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.85}
      >
        <Text style={globalStyles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};