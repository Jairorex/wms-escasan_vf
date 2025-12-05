import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Package, ClipboardList, CheckCircle, Clock, AlertTriangle } from 'lucide-react-native';
import api from '../api/axiosClient';
import Colors from '../constants/colors';

export default function HomeScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, pendientes: 0, completadas: 0 });
  const [tareas, setTareas] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Obtener tareas
      const tasksResponse = await api.get('/tasks', { params: { estado: 'CREADA', limit: 5 } });
      setTareas(tasksResponse.data?.data || []);
      
      // Obtener alertas
      const alertsResponse = await api.get('/alertas', { params: { estado: 'PENDIENTE', limit: 5 } });
      setAlertas(alertsResponse.data?.data || []);
      
      // Obtener KPIs
      const kpisResponse = await api.get('/tareas/kpis');
      if (kpisResponse.data) {
        setStats({
          total: kpisResponse.data.total || 0,
          pendientes: kpisResponse.data.pendientes || 0,
          completadas: kpisResponse.data.completadas || 0
        });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      // Datos de ejemplo en caso de error
      setStats({ total: 12, pendientes: 5, completadas: 7 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const getEstadoBadgeColor = (estado) => {
    switch (estado) {
      case 'CREADA':
        return { bg: Colors.confirm.light, text: Colors.confirm.main };
      case 'EN_CURSO':
        return { bg: Colors.escasan.orange.light, text: Colors.escasan.orange.main };
      case 'COMPLETADA':
        return { bg: Colors.escasan.green.light, text: Colors.escasan.green.main };
      default:
        return { bg: '#f5f5f5', text: '#666' };
    }
  };

  const getNivelAlertaColor = (nivel) => {
    switch (nivel) {
      case 'ALTO':
        return Colors.cancel.main;
      case 'MEDIO':
        return Colors.escasan.orange.main;
      default:
        return Colors.confirm.main;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.escasan.green.main} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
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
            <View style={[styles.card, { backgroundColor: Colors.confirm.light }]}>
              <ClipboardList color={Colors.confirm.main} size={24} />
              <Text style={styles.cardValue}>{stats.total}</Text>
              <Text style={styles.cardLabel}>Tareas</Text>
            </View>
            <View style={[styles.card, { backgroundColor: Colors.escasan.orange.light }]}>
              <Clock color={Colors.escasan.orange.main} size={24} />
              <Text style={styles.cardValue}>{stats.pendientes}</Text>
              <Text style={styles.cardLabel}>Pendientes</Text>
            </View>
            <View style={[styles.card, { backgroundColor: Colors.escasan.green.light }]}>
              <CheckCircle color={Colors.escasan.green.main} size={24} />
              <Text style={styles.cardValue}>{stats.completadas}</Text>
              <Text style={styles.cardLabel}>Completadas</Text>
            </View>
          </View>
        </View>

        {/* Tareas Recientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tareas Recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.viewAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {tareas.length > 0 ? (
            <View style={styles.list}>
              {tareas.slice(0, 5).map((tarea) => {
                const badgeColor = getEstadoBadgeColor(tarea.estado);
                return (
                  <TouchableOpacity 
                    key={tarea.id} 
                    style={styles.listItem}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: tarea.id })}
                  >
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemTitle}>
                        {tarea.numero_tarea || `Tarea #${tarea.id}`}
                      </Text>
                      <Text style={styles.listItemSubtitle}>
                        {tarea.tipo_tarea} - {tarea.estado}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badgeColor.bg }]}>
                      <Text style={[styles.badgeText, { color: badgeColor.text }]}>
                        {tarea.estado}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay tareas pendientes</Text>
            </View>
          )}
        </View>

        {/* Alertas Recientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertas Recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.viewAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {alertas.length > 0 ? (
            <View style={styles.list}>
              {alertas.slice(0, 5).map((alerta) => (
                <View key={alerta.id} style={styles.alertItem}>
                  <AlertTriangle 
                    size={20} 
                    color={getNivelAlertaColor(alerta.nivel_riesgo)} 
                    style={styles.alertIcon}
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alerta.tipo}</Text>
                    <Text style={styles.alertDescription} numberOfLines={2}>
                      {alerta.descripcion}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay alertas pendientes</Text>
            </View>
          )}
        </View>

        {/* Espacio inferior */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  scrollView: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16
  },
  header: { 
    padding: 24, 
    paddingTop: 24,
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    marginTop: 10
  },
  greeting: { fontSize: 16, color: '#666' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  role: { fontSize: 14, color: Colors.escasan.green.main, marginTop: 4, fontWeight: '600' },
  
  statsContainer: { padding: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#444' },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { 
    width: '31%', 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2
  },
  cardValue: { fontSize: 22, fontWeight: 'bold', marginVertical: 5, color: '#333' },
  cardLabel: { fontSize: 12, color: '#666' },

  section: { 
    paddingHorizontal: 20, 
    marginBottom: 20 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.escasan.green.main,
    fontWeight: '600'
  },
  
  list: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  listItemContent: {
    flex: 1
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#888'
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  
  alertItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  alertIcon: {
    marginTop: 2,
    marginRight: 12
  },
  alertContent: {
    flex: 1
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  alertDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18
  },
  
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  emptyText: {
    fontSize: 14,
    color: '#999'
  }
});
