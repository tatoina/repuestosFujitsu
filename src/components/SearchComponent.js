import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
// v2.1.0 - Búsqueda automática inteligente
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentSearchType, setCurrentSearchType] = useState('description'); // Para mostrar al usuario qué tipo de búsqueda se está haciendo

  useEffect(() => {
    // Solo inicializar datos una vez
    const init = async () => {
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
    
    init();
  }, []); // Sin dependencias adicionales

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchType('description');
      return;
    }

    // Detectar automáticamente el tipo de búsqueda
    const firstChar = query.trim().charAt(0);
    const isNumeric = /\d/.test(firstChar);
    const searchType = isNumeric ? 'code' : 'description';
    
    setCurrentSearchType(searchType);
    console.log(`Búsqueda automática: "${query}" detectado como ${searchType === 'code' ? 'código' : 'descripción'}`);

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

  // Búsqueda en tiempo real con detección automática
  const handleTextChange = (text) => {
    setSearchQuery(text);
    
    // Si no hay texto, limpiar resultados inmediatamente
    if (!text.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      setCurrentSearchType('description');
      return;
    }
    
    // Mostrar loading inmediatamente
    setIsLoading(true);
    
    // Crear nuevo timer para búsqueda con delay
    const newTimer = setTimeout(() => {
      handleSearch(text);
    }, 300); // 300ms de delay
    
    // Limpiar timer anterior si existe
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    setDebounceTimer(newTimer);
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
          
          {/* Fecha actual para verificar actualizaciones */}
          <Text style={styles.dateText}>
            🚫 SW DESHABILITADO - Chrome Test - 3 Nov 2025 - 15:45
          </Text>
          
          {/* Indicador de tipo de búsqueda */}
          {searchQuery.trim() && (
            <View style={styles.searchTypeIndicator}>
              <Chip 
                icon={() => (
                  <Ionicons
                    name={currentSearchType === 'description' ? 'text' : 'barcode'}
                    size={16}
                    color="#6200ee"
                  />
                )}
                style={[styles.chip, styles.activeChip]}
                textStyle={styles.activeChipText}
              >
                {currentSearchType === 'description' ? 'Buscando por Descripción' : 'Buscando por Código'}
              </Chip>
            </View>
          )}

          <Searchbar
            placeholder="Escribe código (123...) o descripción (abc...) para buscar"
            onChangeText={handleTextChange}
            value={searchQuery}
            onSubmitEditing={() => handleSearch()}
            style={styles.searchbar}
            icon={() => (
              <Ionicons
                name="search"
                size={20}
                color="#666"
              />
            )}
            autoFocus={true}
          />
          
          {/* Ayuda para el usuario */}
          {!searchQuery.trim() && (
            <Text style={styles.helpText}>
              💡 Tip: Comienza con número para buscar código, con letra para descripción
            </Text>
          )}
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
                    {currentSearchType === 'description' ? item.code : item.description}
                  </Title>
                </View>
                
                <Paragraph style={styles.resultSubtitle}>
                  {currentSearchType === 'description' ? item.description : item.code}
                </Paragraph>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(
                      currentSearchType === 'description' ? item.code : item.description
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
    borderRadius: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  resultTitle: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6200ee',
    fontWeight: 'bold',
    flex: 1,
    flexWrap: 'wrap',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  searchTypeIndicator: {
    marginBottom: 12,
    alignItems: 'center',
  },
  helpText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
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
  dateText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
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