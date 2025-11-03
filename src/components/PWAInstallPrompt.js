import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Card, Title, Paragraph, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { usePWA, useNetworkStatus } from '../hooks/usePWA';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const isOnline = useNetworkStatus();

  if (Platform.OS !== 'web') {
    return null; // Solo mostrar en web
  }

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      console.log('App instalada exitosamente');
    }
  };

  return (
    <View style={styles.container}>
      {/* Indicador de estado de red */}
      {!isOnline && (
        <Chip 
          icon="wifi-off" 
          style={styles.offlineChip}
          textStyle={styles.offlineText}
        >
          Modo Offline
        </Chip>
      )}

      {/* Prompt de instalación */}
      {isInstallable && !isInstalled && (
        <Card style={styles.installCard}>
          <Card.Content>
            <View style={styles.installContent}>
              <Ionicons name="download" size={32} color="#6200ee" />
              <View style={styles.installText}>
                <Title style={styles.installTitle}>Instalar App</Title>
                <Paragraph style={styles.installDescription}>
                  Instala RepuestosFuji en tu dispositivo para acceso rápido
                </Paragraph>
              </View>
              <Button
                mode="contained"
                onPress={handleInstall}
                style={styles.installButton}
                icon="download"
                compact
              >
                Instalar
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Confirmación de instalación */}
      {isInstalled && (
        <Chip 
          icon="check-circle" 
          style={styles.installedChip}
          textStyle={styles.installedText}
        >
          App Instalada
        </Chip>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1000,
  },
  offlineChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF5722',
    marginBottom: 8,
  },
  offlineText: {
    color: 'white',
  },
  installedChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
  },
  installedText: {
    color: 'white',
  },
  installCard: {
    backgroundColor: '#f8f9ff',
    borderColor: '#6200ee',
    borderWidth: 1,
  },
  installContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  installText: {
    flex: 1,
    marginHorizontal: 12,
  },
  installTitle: {
    fontSize: 16,
    color: '#6200ee',
    marginBottom: 4,
  },
  installDescription: {
    fontSize: 12,
    color: '#666',
  },
  installButton: {
    minWidth: 100,
  },
});

export default PWAInstallPrompt;