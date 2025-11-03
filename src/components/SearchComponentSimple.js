import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Text,
  Provider as PaperProvider,
} from 'react-native-paper';

const SearchComponentSimple = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Datos de ejemplo estáticos para probar
  const sampleData = [
    { id: 1, code: 'CBL001', description: 'Cable USB tipo A' },
    { id: 2, code: 'CBL002', description: 'Cable USB tipo C' },
    { id: 3, code: 'FLT001', description: 'Filtro de aceite motor' },
    { id: 4, code: 'BRK002', description: 'Pastillas de freno delanteras' },
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = sampleData.filter(item =>
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.code.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered);
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Title style={styles.title}>Búsqueda Simple - Test</Title>
        
        <Searchbar
          placeholder="Buscar repuestos..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((item) => (
            <Card key={item.id} style={styles.resultCard}>
              <Card.Content>
                <Title style={styles.resultCode}>{item.code}</Title>
                <Paragraph style={styles.resultDescription}>
                  {item.description}
                </Paragraph>
              </Card.Content>
            </Card>
          ))}
          
          {searchQuery && searchResults.length === 0 && (
            <Text style={styles.noResults}>No se encontraron resultados</Text>
          )}
        </ScrollView>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#6200ee',
  },
  searchbar: {
    marginBottom: 20,
    elevation: 4,
  },
  resultsContainer: {
    flex: 1,
  },
  resultCard: {
    marginBottom: 10,
    elevation: 2,
  },
  resultCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  resultDescription: {
    fontSize: 14,
    color: '#555',
  },
  noResults: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

export default SearchComponentSimple;