import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MedicinesScreen } from '../screens/medicines/MedicinesScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Define os tipos das rotas — navegação tipada
export type RootTabParamList = {
  Hoje: undefined;
  Remédios: undefined;
  Histórico: undefined;
  Configurações: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Hoje: 'calendar-outline',
  Remédios: 'medical-outline',
  Histórico: 'time-outline',
  Configurações: 'settings-outline',
};

const tabActiveIcons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Hoje: 'calendar',
  Remédios: 'medical',
  Histórico: 'time',
  Configurações: 'settings',
}

export const TabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: theme.colors.primary[500],
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.neutral[500],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? tabActiveIcons[route.name] : tabIcons[route.name];
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Hoje" component={HomeScreen} />
      <Tab.Screen name="Remédios" component={MedicinesScreen} />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
      <Tab.Screen name="Configurações" component={SettingsScreen} />
    </Tab.Navigator>
  );
};