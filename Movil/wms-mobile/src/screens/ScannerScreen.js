import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Scan, CheckCircle, X, RotateCcw } from 'lucide-react-native';
import api from '../api/axiosClient';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [validating, setValidating] = useState(false);

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Scan size={64} color="#007bff" />
          <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a la cámara para escanear códigos de barras y QR
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Dar Permiso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || validating) return;
    
    setScanned(true);
    setValidating(true);
    setScanResult({ type, data, status: 'validating' });

    try {
      // Validar el código escaneado
      const response = await api.post('/tasks/validate-scan', { code: data });
      
      if (response.data.success) {
        setScanResult({
          type,
          data,
          status: 'success',
          message: response.data.message || 'Código válido',
          info: response.data.data,
        });
      } else {
        setScanResult({
          type,
          data,
          status: 'error',
          message: response.data.message || 'Código inválido',
        });
      }
    } catch (error) {
      setScanResult({
        type,
        data,
        status: 'error',
        message: error.response?.data?.message || 'Error al validar código',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScanResult(null);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e"],
        }}
      />
      
      {/* Overlay con guía de escaneo */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={styles.corner} style={[styles.corner, styles.topLeft]} />
          <View style={styles.corner} style={[styles.corner, styles.topRight]} />
          <View style={styles.corner} style={[styles.corner, styles.bottomLeft]} />
          <View style={styles.corner} style={[styles.corner, styles.bottomRight]} />
        </View>
        
        <Text style={styles.scanInstruction}>
          Apunta la cámara al código de barras o QR
        </Text>
      </View>

      {/* Resultado del escaneo */}
      {scanResult && (
        <View style={styles.resultContainer}>
          <View style={[styles.resultCard, scanResult.status === 'success' ? styles.successCard : styles.errorCard]}>
            {validating ? (
              <>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.resultText}>Validando...</Text>
              </>
            ) : (
              <>
                {scanResult.status === 'success' ? (
                  <CheckCircle size={48} color="#4caf50" />
                ) : (
                  <X size={48} color="#f44336" />
                )}
                <Text style={styles.resultTitle}>
                  {scanResult.status === 'success' ? 'Código Válido' : 'Código Inválido'}
                </Text>
                <Text style={styles.resultMessage}>{scanResult.message}</Text>
                {scanResult.data && (
                  <Text style={styles.resultCode}>Código: {scanResult.data}</Text>
                )}
                <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain}>
                  <RotateCcw size={20} color="#fff" />
                  <Text style={styles.scanAgainText}>Escanear de Nuevo</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007bff',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanInstruction: {
    marginTop: 40,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    fontWeight: '500',
  },
  resultContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  resultText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultCode: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});