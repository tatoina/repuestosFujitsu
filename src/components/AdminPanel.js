import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Title,
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Paragraph,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as XLSX from 'xlsx';
import { searchService } from '../services/searchService';

const AdminPanel = ({ visible, onDismiss }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handlePasswordSubmit = () => {
    if (password === 'fujitsu') {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      Alert.alert('Error', 'Contraseña incorrecta');
      setPassword('');
    }
  };

  const handleFileUpload = async () => {
    try {
      setIsUploading(true);
      setUploadStatus('Preparando selector de archivo...');

      if (Platform.OS === 'web') {
        // Para web, usar input de archivo HTML
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        
        input.onchange = async (event) => {
          const file = event.target.files[0];
          if (!file) {
            setIsUploading(false);
            setUploadStatus('');
            return;
          }

          try {
            setUploadStatus('Procesando archivo Excel...');
            
            const arrayBuffer = await file.arrayBuffer();
            await processExcelFile(arrayBuffer);
          } catch (error) {
            console.error('Error procesando archivo:', error);
            setUploadStatus('');
            setIsUploading(false);
            Alert.alert('Error', `No se pudo procesar el archivo: ${error.message}`);
          }
        };
        
        input.click();
      } else {
        // Para móvil, usar DocumentPicker
        const DocumentPicker = require('expo-document-picker');
        
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
          ],
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          setIsUploading(false);
          setUploadStatus('');
          return;
        }

        setUploadStatus('Procesando archivo Excel...');
        
        const response = await fetch(result.assets[0].uri);
        const arrayBuffer = await response.arrayBuffer();
        await processExcelFile(arrayBuffer);
      }

    } catch (error) {
      console.error('Error al abrir selector:', error);
      setUploadStatus('');
      setIsUploading(false);
      Alert.alert('Error', `Error al abrir selector de archivo: ${error.message}`);
    }
  };

  const processExcelFile = async (arrayBuffer) => {
    try {
      setUploadStatus('Leyendo archivo Excel...');
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('El archivo Excel está vacío');
      }

      setUploadStatus('Convirtiendo datos...');

      // Detectar columnas automáticamente
      const keys = Object.keys(jsonData[0]);
      
      const codeColumn = keys.find(key => 
        key.toLowerCase().includes('cod') || 
        key.toLowerCase().includes('code') ||
        keys.indexOf(key) === 0
      ) || keys[0];

      const descColumn = keys.find(key => 
        key.toLowerCase().includes('desc') || 
        key.toLowerCase().includes('description') ||
        key.toLowerCase().includes('nombre') ||
        (keys.indexOf(key) === 1 && !key.toLowerCase().includes('cod'))
      ) || keys[1];

      // Convertir a formato estándar
      const convertedData = jsonData.map((row, index) => {
        const code = String(row[codeColumn] || '').trim();
        const description = String(row[descColumn] || '').trim();
        
        return {
          id: index + 1,
          code: code,
          description: description,
          originalData: row
        };
      }).filter(item => item.code && item.description);

      setUploadStatus('Actualizando base de datos...');

      // Actualizar el servicio de búsqueda
      await searchService.updateData(convertedData);

      setUploadStatus(`✅ Base de datos actualizada exitosamente!\n${convertedData.length} repuestos cargados`);

      setTimeout(() => {
        setUploadStatus('');
        setIsUploading(false);
        Alert.alert(
          'Éxito', 
          `Base de datos actualizada con ${convertedData.length} repuestos`,
          [{ text: 'OK', onPress: () => onDismiss() }]
        );
      }, 2000);

    } catch (error) {
      throw error;
    }
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setPassword('');
    setUploadStatus('');
    setIsUploading(false);
    onDismiss();
  };

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={handleClose}
        contentContainerStyle={styles.modal}
      >
        <Card style={styles.card}>
          <Card.Content>
            {!isAuthenticated ? (
              // Pantalla de autenticación
              <View style={styles.authContainer}>
                <View style={styles.headerContainer}>
                  <Ionicons name="shield-checkmark" size={48} color="#6200ee" />
                  <Title style={styles.title}>Panel de Administración</Title>
                </View>
                
                <Paragraph style={styles.subtitle}>
                  Ingresa la contraseña para acceder
                </Paragraph>

                <TextInput
                  label="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  mode="outlined"
                  style={styles.input}
                  onSubmitEditing={handlePasswordSubmit}
                  autoFocus
                />

                <View style={styles.buttonContainer}>
                  <Button 
                    mode="outlined" 
                    onPress={handleClose}
                    style={styles.button}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={handlePasswordSubmit}
                    style={styles.button}
                    disabled={!password}
                  >
                    Acceder
                  </Button>
                </View>
              </View>
            ) : (
              // Panel de administración
              <View style={styles.adminContainer}>
                <View style={styles.headerContainer}>
                  <Ionicons name="cloud-upload" size={48} color="#6200ee" />
                  <Title style={styles.title}>Actualizar Base de Datos</Title>
                </View>

                <Paragraph style={styles.subtitle}>
                  Selecciona un archivo Excel para actualizar la base de datos de repuestos
                </Paragraph>

                {isUploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color="#6200ee" />
                    <Text style={styles.uploadStatus}>{uploadStatus}</Text>
                  </View>
                ) : (
                  <View style={styles.uploadContainer}>
                    <Button
                      mode="contained"
                      onPress={handleFileUpload}
                      icon="file-excel"
                      style={styles.uploadButton}
                    >
                      Seleccionar archivo Excel
                    </Button>

                    <Text style={styles.formatInfo}>
                      Formatos soportados: .xlsx, .xls
                    </Text>
                    <Text style={styles.formatInfo}>
                      El archivo debe tener columnas de código y descripción
                    </Text>
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  <Button 
                    mode="outlined" 
                    onPress={handleClose}
                    style={styles.button}
                    disabled={isUploading}
                  >
                    Cerrar
                  </Button>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    maxHeight: '80%',
  },
  authContainer: {
    padding: 20,
  },
  adminContainer: {
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6200ee',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  uploadContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  uploadButton: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  formatInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  uploadStatus: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    color: '#6200ee',
  },
});

export default AdminPanel;