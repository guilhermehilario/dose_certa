import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import {
  MedicinesListScreen,
  MedicineDetailsScreen,
  MedicineFormScreen,
} from '../screens/medicines';
import type { MedicinesStackParamList } from '../types';

const Stack = createNativeStackNavigator<MedicinesStackParamList>();

export const MedicinesStackNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MedicinesList"
        component={MedicinesListScreen}
        options={{ title: 'Remédios' }}
      />
      <Stack.Screen
        name="MedicineDetails"
        component={MedicineDetailsScreen}
        options={{ title: 'Detalhes' }}
      />
      <Stack.Screen
        name="MedicineForm"
        component={MedicineFormScreen}
        options={({ route }) => ({
          title: route.params?.medicineId ? 'Editar remédio' : 'Novo remédio',
        })}
      />
    </Stack.Navigator>
  );
};