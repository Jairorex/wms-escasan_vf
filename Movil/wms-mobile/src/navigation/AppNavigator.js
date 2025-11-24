import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { 
  Home, Scan, ClipboardList, Package, BarChart3, Bell, User, 
  Settings, Users, UserPlus, Move 
} from 'lucide-react-native';

// Pantallas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import TasksListScreen from '../screens/TasksListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import LocationSearchScreen from '../screens/LocationSearchScreen';
import TaskAssignmentScreen from '../screens/TaskAssignmentScreen';
import OperatorsManagementScreen from '../screens/OperatorsManagementScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MovementsHistoryScreen from '../screens/MovementsHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Función para verificar rol
const hasRole = (userInfo, allowedRoles) => {
  if (!userInfo?.rol) return false;
  const userRol = typeof userInfo.rol === 'string' 
    ? userInfo.rol.toLowerCase() 
    : userInfo.rol?.nombre?.toLowerCase();
  return allowedRoles.some(role => userRol === role.toLowerCase());
};

// Stack de Tareas
function TasksStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TasksList" 
        component={TasksListScreen}
        options={{ title: 'Mis Tareas' }}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{ title: 'Detalle de Tarea' }}
      />
    </Stack.Navigator>
  );
}

// Stack de Inventario
function InventoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="InventoryList" 
        component={InventoryScreen}
        options={{ title: 'Inventario' }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ title: 'Detalle de Producto' }}
      />
      <Stack.Screen 
        name="LocationSearch" 
        component={LocationSearchScreen}
        options={{ title: 'Búsqueda de Ubicación' }}
      />
    </Stack.Navigator>
  );
}

// Stack de Supervisor/Admin
function ManagementStack() {
  const { userInfo } = useContext(AuthContext);
  
  return (
    <Stack.Navigator>
      {hasRole(userInfo, ['supervisor', 'administrador']) && (
        <>
          <Stack.Screen 
            name="TaskAssignment" 
            component={TaskAssignmentScreen}
            options={{ title: 'Asignar Tareas' }}
          />
          <Stack.Screen 
            name="OperatorsManagement" 
            component={OperatorsManagementScreen}
            options={{ title: 'Gestión de Operarios' }}
          />
        </>
      )}
      <Stack.Screen 
        name="Statistics" 
        component={StatisticsScreen}
        options={{ title: 'Estadísticas' }}
      />
    </Stack.Navigator>
  );
}

// Tabs principales
function MainTabs() {
  const { logout, userInfo } = useContext(AuthContext);
  
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={HomeScreen} 
        options={{ 
          tabBarIcon: ({color}) => <Home size={24} color={color} />,
          title: 'Inicio'
        }}
      />
      
      <Tab.Screen 
        name="Tasks" 
        component={TasksStack}
        options={{ 
          tabBarIcon: ({color}) => <ClipboardList size={24} color={color} />,
          title: 'Tareas',
          headerShown: false
        }}
      />
      
      <Tab.Screen 
        name="Scan" 
        component={ScannerScreen}
        options={{ 
          tabBarIcon: ({color}) => <Scan size={24} color={color} />,
          title: 'Escanear'
        }}
      />
      
      <Tab.Screen 
        name="Inventory" 
        component={InventoryStack}
        options={{ 
          tabBarIcon: ({color}) => <Package size={24} color={color} />,
          title: 'Inventario',
          headerShown: false
        }}
      />
      
      {hasRole(userInfo, ['supervisor', 'administrador']) && (
        <Tab.Screen 
          name="Management" 
          component={ManagementStack}
          options={{ 
            tabBarIcon: ({color}) => <BarChart3 size={24} color={color} />,
            title: 'Gestión',
            headerShown: false
          }}
        />
      )}
      
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          tabBarIcon: ({color}) => <Bell size={24} color={color} />,
          title: 'Alertas',
          tabBarBadge: null // Aquí puedes agregar el contador de alertas pendientes
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          tabBarIcon: ({color}) => <User size={24} color={color} />,
          title: 'Perfil'
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, userToken, userInfo } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ 
                headerShown: true,
                title: 'Configuración',
                presentation: 'modal'
              }}
            />
            <Stack.Screen 
              name="MovementsHistory" 
              component={MovementsHistoryScreen}
              options={{ 
                headerShown: true,
                title: 'Historial de Movimientos'
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
