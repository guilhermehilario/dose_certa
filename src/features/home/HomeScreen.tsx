import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { globalStyles } from '../../constants/globalStyles';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={globalStyles.centeredScreen}>
      <Text style={[globalStyles.title, { color: theme.colors.text }]}>Hoje</Text>
      <Text style={[globalStyles.subtitle, { color: theme.colors.textSecondary }]}>Seus lembretes de hoje aparecerão aqui</Text>
    </View>
  );
};