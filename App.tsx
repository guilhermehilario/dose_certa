import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, SafeAreaView } from 'react-native';

// Definição do tipo do Medicamento
interface Medicamento {
  id: string;
  nome: string;
  horario: string;
}

export default function App() {
  const [nome, setNome] = useState('');
  const [horario, setHorario] = useState('');
  const [remedios, setRemedios] = useState<Medicamento[]>([]);

  const adicionarRemedio = () => {
    if (!nome || !horario) return;

    const novoRemedio: Medicamento = {
      id: Math.random().toString(),
      nome,
      horario,
    };

    setRemedios([...remedios, novoRemedio]);
    setNome('');
    setHorario('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Meu Alarme de Remédios 💊</Text>

      <View style={styles.formulario}>
        <TextInput 
          style={styles.input} 
          placeholder="Nome do remédio (ex: Dipirona)" 
          value={nome}
          onChangeText={setNome}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Horário (ex: 08:00)" 
          value={horario}
          onChangeText={setHorario}
        />
        <Button title="Adicionar Remédio" onPress={adicionarRemedio} color="#007AFF" />
      </View>

      <FlatList
        data={remedios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRemedio}>
            <Text style={styles.nomeRemedio}>{item.nome}</Text>
            <Text style={styles.horarioRemedio}>⏰ {item.horario}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  formulario: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  itemRemedio: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  nomeRemedio: {
    fontSize: 18,
    fontWeight: '500',
  },
  horarioRemedio: {
    fontSize: 16,
    color: '#666',
  },
});