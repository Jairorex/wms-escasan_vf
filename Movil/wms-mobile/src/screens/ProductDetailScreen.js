import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Package, Box, MapPin, Hash, Weight, Ruler } from 'lucide-react-native';
import api from '../api/axiosClient';

export default function ProductDetailScreen({ route, navigation }) {
  const { productoId } = route.params;
  const [producto, setProducto] = useState(null);
  const [stock, setStock] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetail();
    fetchStock();
  }, [productoId]);

  const fetchProductDetail = async () => {
    try {
      const response = await api.get(`/productos/${productoId}`);
      setProducto(response.data.data || response.data);
    } catch (error) {
      console.error('Error al cargar producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStock = async () => {
    try {
      const response = await api.get(`/inventario/producto/${productoId}/stock`);
      setStock(response.data.data?.stock_total || 0);
    } catch (error) {
      console.error('Error al cargar stock:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!producto) {
    return (
      <View style={styles.centerContainer}>
        <Text>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Package size={32} color="#007bff" />
        </View>
        <Text style={styles.productName}>{producto.nombre}</Text>
        <Text style={styles.productSku}>SKU: {producto.sku}</Text>
      </View>

      {/* Stock */}
      <View style={styles.stockCard}>
        <Text style={styles.stockLabel}>Stock Disponible</Text>
        <Text style={styles.stockValue}>{stock}</Text>
      </View>

      {/* Información */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Producto</Text>
        {producto.descripcion && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Descripción:</Text>
            <Text style={styles.infoValue}>{producto.descripcion}</Text>
          </View>
        )}
        {producto.peso && (
          <View style={styles.infoRow}>
            <Weight size={18} color="#666" />
            <Text style={styles.infoLabel}>Peso: </Text>
            <Text style={styles.infoValue}>{producto.peso} kg</Text>
          </View>
        )}
        {producto.volumen && (
          <View style={styles.infoRow}>
            <Ruler size={18} color="#666" />
            <Text style={styles.infoLabel}>Volumen: </Text>
            <Text style={styles.infoValue}>{producto.volumen} m³</Text>
          </View>
        )}
        {producto.clasificacion && (
          <View style={styles.infoRow}>
            <Hash size={18} color="#666" />
            <Text style={styles.infoLabel}>Clasificación: </Text>
            <Text style={styles.infoValue}>{producto.clasificacion.nombre}</Text>
          </View>
        )}
        {producto.tipoProducto && (
          <View style={styles.infoRow}>
            <Box size={18} color="#666" />
            <Text style={styles.infoLabel}>Tipo: </Text>
            <Text style={styles.infoValue}>{producto.tipoProducto.nombre}</Text>
          </View>
        )}
      </View>

      {/* Ubicaciones */}
      <TouchableOpacity
        style={styles.section}
        onPress={() => navigation.navigate('LocationSearch', { productoId: producto.id })}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ubicaciones</Text>
          <MapPin size={20} color="#007bff" />
        </View>
        <Text style={styles.sectionSubtitle}>Toca para buscar ubicaciones de este producto</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  productSku: {
    fontSize: 14,
    color: '#999',
  },
  stockCard: {
    backgroundColor: '#007bff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  stockValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

