import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Package, ClipboardList, CheckCircle, Clock } from 'lucide-react-native';
import api from '../api/axiosClient';

export default function HomeScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, pendientes: 0, completadas: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      // Aquí puedes llamar a tu endpoint real de KPIs
      // const res = await api.get('/tareas/kpis'); 
      // setStats(res.data);
      
      // Por ahora simulamos datos para que veas la UI
      setStats({ total: 12, pendientes: 5, completadas: 7 });
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola,</Text>
        <Text style={styles.username}>{userInfo?.nombre || 'Usuario'}</Text>
        <Text style={styles.role}>{userInfo?.rol || 'Operario'}</Text>
      </View>

      {/* KPIs / Resumen */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Resumen del Día</Text>
        <View style={styles.cardsRow}>
          <View style={[styles.card, { backgroundColor: '#e3f2fd' }]}>
            <ClipboardList color="#1e88e5" size={24} />
            <Text style={styles.cardValue}>{stats.total}</Text>
            <Text style={styles.cardLabel}>Tareas</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#fff3e0' }]}>
            <Clock color="#fb8c00" size={24} />
            <Text style={styles.cardValue}>{stats.pendientes}</Text>
            <Text style={styles.cardLabel}>Pendientes</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#e8f5e9' }]}>
            <CheckCircle color="#43a047" size={24} />
            <Text style={styles.cardValue}>{stats.completadas}</Text>
            <Text style={styles.cardLabel}>Listas</Text>
          </View>
        </View>
      </View>

      {/* Accesos Directos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => navigation.navigate('Scan')}
        >
          <View style={styles.iconBox}>
            <Package color="#fff" size={24} />
          </View>
          <View>
            <Text style={styles.actionTitle}>Escanear Producto</Text>
            <Text style={styles.actionSubtitle}>Verificar info o mover</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => navigation.navigate('Tasks')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#ff9800' }]}>
            <ClipboardList color="#fff" size={24} />
          </View>
          <View>
            <Text style={styles.actionTitle}>Mis Tareas</Text>
            <Text style={styles.actionSubtitle}>Ver tareas asignadas</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => navigation.navigate('Inventory')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#4caf50' }]}>
            <Package color="#fff" size={24} />
          </View>
          <View>
            <Text style={styles.actionTitle}>Consultar Inventario</Text>
            <Text style={styles.actionSubtitle}>Ver stock disponible</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  greeting: { fontSize: 16, color: '#666' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  role: { fontSize: 14, color: '#007bff', marginTop: 4, fontWeight: '600' },
  
  statsContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#444' },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { 
    width: '31%', padding: 15, borderRadius: 12, alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  cardValue: { fontSize: 22, fontWeight: 'bold', marginVertical: 5, color: '#333' },
  cardLabel: { fontSize: 12, color: '#666' },

  section: { paddingHorizontal: 20 },
  actionButton: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    padding: 15, borderRadius: 12, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  actionSubtitle: { fontSize: 13, color: '#888' }
});
