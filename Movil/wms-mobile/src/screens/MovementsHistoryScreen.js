import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Move, ArrowRight, Calendar, Package, MapPin } from 'lucide-react-native';
import api from '../api/axiosClient';

export default function MovementsHistoryScreen() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const fetchMovimientos = async () => {
    try {
      // Nota: Necesitarás crear este endpoint en el backend
      // Por ahora simulamos datos
      // const response = await api.get('/movimientos');
      // setMovimientos(response.data.data || []);
      
      // Datos simulados
      setMovimientos([]);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMovimientos();
  };

  const renderMovimiento = ({ item }) => (
    <View style={styles.movimientoCard}>
      <View style={styles.movimientoHeader}>
        <View style={styles.iconContainer}>
          <Move size={24} color="#007bff" />
        </View>
        <View style={styles.movimientoInfo}>
          <Text style={styles.movimientoType}>Movimiento #{item.id}</Text>
          <View style={styles.movimientoDetails}>
            <Package size={14} color="#666" />
            <Text style={styles.movimientoText}>
              {item.lote?.producto?.nombre || 'Producto'} - Cantidad: {item.cantidad}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.movimientoPath}>
        <View style={styles.locationBox}>
          <MapPin size={16} color="#ff9800" />
          <Text style={styles.locationText}>{item.ubicacion_origen?.codigo || 'Origen'}</Text>
        </View>
        <ArrowRight size={20} color="#999" />
        <View style={styles.locationBox}>
          <MapPin size={16} color="#4caf50" />
          <Text style={styles.locationText}>{item.ubicacion_destino?.codigo || 'Destino'}</Text>
        </View>
      </View>

      {item.fecha_movimiento && (
        <View style={styles.movimientoFooter}>
          <Calendar size={14} color="#999" />
          <Text style={styles.movimientoDate}>
            {new Date(item.fecha_movimiento).toLocaleString('es-ES')}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={movimientos}
        renderItem={renderMovimiento}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Move size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay movimientos registrados</Text>
            <Text style={styles.emptySubtext}>
              Los movimientos se registrarán automáticamente al completar tareas
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 10 },
  movimientoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  movimientoHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  movimientoInfo: {
    flex: 1,
  },
  movimientoType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  movimientoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  movimientoText: {
    fontSize: 13,
    color: '#666',
  },
  movimientoPath: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  movimientoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  movimientoDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

