import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';

const Header = ({ onAddPress }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Pedidos</Text>
    <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
      <Plus size={20} color="#fff" />
      <Text style={styles.addButtonText}>Novo</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default Header;