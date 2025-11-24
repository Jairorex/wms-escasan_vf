import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Package, MapPin, Search, Box } from 'lucide-react-native';
import api from '../api/axiosClient';

export default function InventoryScreen({ navigation }) {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
      const params = {};
      if (search) {
        params.search = search;
      }
      const response = await api.get('/inventario', { params });
      setInventario(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventario();
  };

  const filteredInventario = inventario.filter(item =>
    item.lote?.producto?.sku?.toLowerCase().includes(search.toLowerCase()) ||
    item.lote?.producto?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    item.ubicacion?.codigo?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ProductDetail', { productoId: item.lote?.producto_id })}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.productName}>{item.lote?.producto?.nombre || 'N/A'}</Text>
          <Text style={styles.productSku}>SKU: {item.lote?.producto?.sku || 'N/A'}</Text>
        </View>
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{item.cantidad || 0}</Text>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Box size={16} color="#666" />
          <Text style={styles.detailText}>Lote: {item.lote?.lote_codigo || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#666" />
          <Text style={styles.detailText}>Ubicación: {item.ubicacion?.codigo || 'N/A'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getEstadoColor(item.estado) + '20' }]}>
          <Text style={[styles.statusText, { color: getEstadoColor(item.estado) }]}>
            {item.estado || 'Disponible'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por SKU, producto o ubicación..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchInventario}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={filteredInventario}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay inventario disponible</Text>
          </View>
        }
      />
    </View>
  );
}

function getEstadoColor(estado) {
  switch (estado) {
    case 'Disponible':
      return '#4caf50';
    case 'Cuarentena':
      return '#ff9800';
    case 'Dañado':
      return '#f44336';
    case 'Transito':
      return '#2196f3';
    default:
      return '#757575';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContainer: { padding: 10 },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#999',
  },
  quantityBadge: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
});

