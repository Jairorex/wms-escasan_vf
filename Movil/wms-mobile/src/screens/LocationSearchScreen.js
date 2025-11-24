import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { MapPin, Search, Package, Box } from 'lucide-react-native';
import api from '../api/axiosClient';

export default function LocationSearchScreen({ route, navigation }) {
  const { productoId } = route.params || {};
  const [ubicaciones, setUbicaciones] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (productoId) {
      fetchInventarioPorProducto();
    } else {
      fetchUbicaciones();
    }
  }, [productoId, search]);

  const fetchUbicaciones = async () => {
    try {
      const response = await api.get('/ubicaciones', { params: { search } });
      setUbicaciones(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchInventarioPorProducto = async () => {
    try {
      const response = await api.get('/inventario', { params: { producto_id: productoId } });
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
    if (productoId) {
      fetchInventarioPorProducto();
    } else {
      fetchUbicaciones();
    }
  };

  const renderUbicacion = ({ item }) => (
    <TouchableOpacity style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.iconContainer}>
          <MapPin size={24} color="#007bff" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.locationCode}>{item.codigo}</Text>
          <Text style={styles.locationPath}>
            {item.pasillo}-{item.estante}-{item.nivel}
          </Text>
        </View>
      </View>
      {item.tipo_ubicacion && (
        <Text style={styles.locationType}>{item.tipo_ubicacion.nombre}</Text>
      )}
    </TouchableOpacity>
  );

  const renderInventario = ({ item }) => (
    <TouchableOpacity style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.iconContainer}>
          <MapPin size={24} color="#007bff" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.locationCode}>{item.ubicacion?.codigo || 'N/A'}</Text>
          <Text style={styles.locationPath}>
            {item.ubicacion?.pasillo}-{item.ubicacion?.estante}-{item.ubicacion?.nivel}
          </Text>
        </View>
        <View style={styles.quantityBadge}>
          <Package size={16} color="#fff" />
          <Text style={styles.quantityText}>{item.cantidad || 0}</Text>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Box size={16} color="#666" />
        <Text style={styles.productText}>
          {item.lote?.producto?.nombre} - Lote: {item.lote?.lote_codigo}
        </Text>
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

  const data = productoId ? inventario : ubicaciones;
  const renderItem = productoId ? renderInventario : renderUbicacion;

  return (
    <View style={styles.container}>
      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={productoId ? "Buscar ubicaciones..." : "Buscar por código o zona..."}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MapPin size={48} color="#ccc" />
            <Text style={styles.emptyText}>No se encontraron ubicaciones</Text>
          </View>
        }
      />
    </View>
  );
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
    alignItems: 'center',
    marginBottom: 10,
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
  itemInfo: {
    flex: 1,
  },
  locationCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationPath: {
    fontSize: 14,
    color: '#666',
  },
  locationType: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  quantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  productText: {
    fontSize: 13,
    color: '#666',
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

