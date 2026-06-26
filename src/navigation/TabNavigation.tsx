import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { HomeScreen } from '../features/home/HomeScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { MedicinesStackNavigator } from './MedicinesStackNavigator';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Hoje: { active: 'calendar', inactive: 'calendar-outline' },
  Remédios: { active: 'medical', inactive: 'medical-outline' },
  Histórico: { active: 'time', inactive: 'time-outline' },
  Configurações: { active: 'settings', inactive: 'settings-outline' },
};

export const TabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Hoje" component={HomeScreen} options={{ tabBarLabel: 'Hoje' }} />
      <Tab.Screen
        name="Remédios"
        component={MedicinesStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
      <Tab.Screen name="Configurações" component={SettingsScreen} />
    </Tab.Navigator>
  );
};