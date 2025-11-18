import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit, X } from 'lucide-react-native';
import { getFieldValue } from '../utils/fieldHelpers';

const ClienteRow = ({ cliente, selectedFields, availableFields, onEdit, onDelete }) => (
  <View style={styles.tableRow}>
    {selectedFields.map(fieldKey => (
      <View key={fieldKey} style={styles.tableCell}>
        <Text style={styles.cellText} numberOfLines={2}>
          {getFieldValue(cliente, fieldKey)}
        </Text>
      </View>
    ))}
    <View style={styles.actionCell}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onEdit(cliente)}
      >
        <Edit size={18} color="#007AFF" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onDelete(cliente.id)}
      >
        <X size={18} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  cellText: {
    color: '#666',
    fontSize: 13,
  },
  actionCell: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
  },
});

export default ClienteRow;