import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Text,
  ActivityIndicator,
  Provider as PaperProvider,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { searchService } from '../services/searchService';
import AdminPanel from './AdminPanel';
import PWAInstallPrompt from './PWAInstallPrompt';

const SearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState('description'); // 'description' o 'code'
  const [dataLoaded, setDataLoaded] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    initializeData();
  }, []); // Solo ejecutar una vez al montar el componente

  // useEffect separado para cleanup del timer
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      await searchService.loadData();
      setDataLoaded(true);
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo cargar la base de datos. Asegúrate de que el archivo Excel esté en la carpeta /data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    console.log(`Buscando: "${query}" en modo: ${searchType}`);

    try {
      setIsLoading(true);
      const results = await searchService.search(query, searchType);
      console.log(`Resultados encontrados: ${results.length}`);
      setSearchResults(results);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      Alert.alert('Error', 'Error al realizar la búsqueda');
    } finally {
      setIsLoading(false);
    }
  };

  // Búsqueda en tiempo real con debounce
  const handleTextChange = (text) => {
    setSearchQuery(text);
    
    // Limpiar el timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Si no hay texto, limpiar resultados inmediatamente
    if (!text.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    
    // Mostrar loading inmediatamente
    setIsLoading(true);
    
    // Crear nuevo timer para búsqueda con delay
    const newTimer = setTimeout(() => {
      handleSearch(text);
    }, 300); // 300ms de delay
    
    setDebounceTimer(newTimer);
  };

  const toggleSearchType = () => {
    // Limpiar timer activo
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
    
    const newSearchType = searchType === 'description' ? 'code' : 'description';
    setSearchType(newSearchType);
    setSearchQuery('');
    setSearchResults([]);
    setIsLoading(false);
  };

  const copyToClipboard = (text) => {
    // En una app real, usarías @react-native-clipboard/clipboard
    Alert.alert('Copiado', `${text} copiado al portapapeles`);
  };

  if (!dataLoaded && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando base de datos...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <PWAInstallPrompt />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title style={styles.title}>Búsqueda de Repuestos</Title>
            <IconButton
              icon="cog"
              size={24}
              onPress={() => setShowAdminPanel(true)}
              style={styles.adminButton}
            />
          </View>
          
          <View style={styles.searchTypeContainer}>
            <Chip
              selected={searchType === 'description'}
              onPress={toggleSearchType}
              style={styles.chip}
            >
              Buscar por Descripción
            </Chip>
            <Chip
              selected={searchType === 'code'}
              onPress={toggleSearchType}
              style={styles.chip}
            >
              Buscar por Código
            </Chip>
          </View>

          <Searchbar
            placeholder={
              searchType === 'description'
                ? 'Escribe para buscar descripción...'
                : 'Escribe para buscar código...'
            }
            onChangeText={handleTextChange}
            value={searchQuery}
            onSubmitEditing={() => handleSearch()}
            style={styles.searchbar}
            icon={() => (
              <Ionicons
                name={searchType === 'description' ? 'text' : 'barcode'}
                size={20}
                color="#666"
              />
            )}
            autoFocus={true}
          />
        </View>

        <ScrollView style={styles.resultsContainer}>
          {isLoading && searchQuery.trim() && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="small" color="#6200ee" />
              <Text style={styles.searchingText}>Buscando...</Text>
            </View>
          )}
          
          {searchResults.length > 0 && !isLoading && (
            <Text style={styles.resultsCount}>
              {searchResults.length} resultado(s) encontrado(s)
            </Text>
          )}

          {searchResults.map((item, index) => (
            <Card key={index} style={styles.resultCard}>
              <Card.Content>
                <View style={styles.resultHeader}>
                  <Ionicons name="car" size={20} color="#6200ee" />
                  <Title style={styles.resultTitle}>
                    {searchType === 'description' ? item.code : item.description}
                  </Title>
                </View>
                
                <Paragraph style={styles.resultSubtitle}>
                  {searchType === 'description' ? item.description : item.code}
                </Paragraph>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(
                      searchType === 'description' ? item.code : item.description
                    )}
                  >
                    <Ionicons name="copy" size={16} color="#6200ee" />
                    <Text style={styles.copyButtonText}>Copiar</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          ))}

          {searchQuery && searchResults.length === 0 && !isLoading && (
            <Card style={styles.noResultsCard}>
              <Card.Content>
                <View style={styles.noResultsContent}>
                  <Ionicons name="search" size={48} color="#ccc" />
                  <Title style={styles.noResultsTitle}>
                    No se encontraron resultados
                  </Title>
                  <Paragraph style={styles.noResultsText}>
                    Intenta con otros términos de búsqueda o cambia el tipo de búsqueda
                  </Paragraph>
                </View>
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        <AdminPanel 
          visible={showAdminPanel}
          onDismiss={() => setShowAdminPanel(false)}
        />
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#6200ee',
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  adminButton: {
    position: 'absolute',
    right: 0,
    top: -8,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    marginHorizontal: 4,
  },
  searchbar: {
    marginBottom: 12,
    elevation: 2,
  },
  searchButton: {
    marginTop: 8,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  searchingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6200ee',
  },
  resultCard: {
    marginBottom: 12,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    marginLeft: 8,
    fontSize: 18,
    color: '#6200ee',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  copyButtonText: {
    marginLeft: 4,
    color: '#6200ee',
    fontSize: 12,
  },
  noResultsCard: {
    marginTop: 32,
    elevation: 2,
  },
  noResultsContent: {
    alignItems: 'center',
    padding: 16,
  },
  noResultsTitle: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
  noResultsText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#999',
  },
});

export default SearchComponent;