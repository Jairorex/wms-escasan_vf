import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import Colors from '../constants/colors';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if(!usuario || !password) return Alert.alert('Error', 'Campos vacíos');
    
    setLoading(true);
    try {
      await login(usuario, password);
    } catch (error) {
      Alert.alert('Error', 'Credenciales incorrectas o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WMS ESCASAN</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Usuario"
        value={usuario}
        autoCapitalize="none"
        onChangeText={setUsuario}
        placeholderTextColor={Colors.text.secondary}
      />
      
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
          placeholderTextColor={Colors.text.secondary}
        />
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff size={20} color="#666" />
          ) : (
            <Eye size={20} color="#666" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Ingresar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: Colors.background.default 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 40, 
    textAlign: 'center', 
    color: Colors.escasan.green.main 
  },
  input: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: Colors.border,
    color: 'black'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingRight: 10
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: 'black'
  },
  eyeButton: {
    padding: 10
  },
  button: { 
    backgroundColor: Colors.escasan.green.main, 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});
