import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import ClienteRow from './ClienteRow';

const ClientesList = ({ 
  clientes, 
  selectedFields, 
  availableFields,
  onEdit,
  onDelete,
  refreshControl 
}) => {
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      {selectedFields.map(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey);
        return (
          <View key={fieldKey} style={styles.tableCell}>
            <Text style={styles.headerText}>{field?.label}</Text>
          </View>
        );
      })}
      <View style={styles.actionHeader}>
        <Text style={styles.headerText}>Ações</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.tableContainer}>
      {renderTableHeader()}
      <FlatList
        data={clientes}
        renderItem={({ item }) => (
          <ClienteRow
            cliente={item}
            selectedFields={selectedFields}
            availableFields={availableFields}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
            <Text style={styles.emptySubtext}>
              Toque em "Novo Cliente" para cadastrar
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingVertical: 15,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
  actionHeader: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ClientesList;