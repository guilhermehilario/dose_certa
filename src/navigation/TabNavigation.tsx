import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { MedicinesStackNavigator } from './MedicinesStackNavigator';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      }}
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