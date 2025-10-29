import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Download, Edit } from "lucide-react-native";
import { getStatusColor, getStatusText } from "../utils/statusHelpers";

const metodoPagamentoOptions = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
];

const OrderDetailsModal = ({
  visible,
  onClose,
  order,
  clientes,
  onExportPDF,
  onEditOrder,
}) => {
  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>Pedido #{order.id}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEditOrder(order)}
              >
                <Edit size={20} color="#fff" />
                <Text style={styles.editButtonText}>Editar Pedido</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => onExportPDF(order, clientes)}
              >
                <Download size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Exportar PDF</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.detailLabel}>Cliente:</Text>
            <Text style={styles.detailValue}>{order.cliente}</Text>

            <Text style={styles.detailLabel}>Data:</Text>
            <Text style={styles.detailValue}>
              {new Date(order.data).toLocaleDateString("pt-BR")}
            </Text>

            <Text style={styles.detailLabel}>Método de Pagamento:</Text>
            <Text style={styles.detailValue}>
              {
                metodoPagamentoOptions.find(
                  (m) => m.value === order.metodoPagamento
                )?.label
              }
            </Text>

            {order.metodoPagamento === "boleto" && order.prazos?.length > 0 && (
              <>
                <Text style={styles.detailLabel}>Prazos de Pagamento:</Text>
                {order.prazos.map((prazo, index) => (
                  <Text key={index} style={styles.detailValue}>
                    {index + 1}ª Parcela: {prazo.dias} dias
                  </Text>
                ))}
              </>
            )}

            <Text style={styles.detailLabel}>Produtos:</Text>
            {order.produtos?.map((produto, index) => (
              <View key={index} style={styles.produtoDetail}>
                <Text style={styles.produtoDetailName}>{produto.nome}</Text>
                {produto.variacaoSelecionada && (
                  <Text style={styles.produtoDetailVariation}>
                    {produto.variacaoSelecionada.tipo === 'cor' ? 'Cor' : 'Tamanho'}: {produto.variacaoSelecionada.valor}
                  </Text>
                )}
                <Text style={styles.produtoDetailInfo}>
                  Qtd: {produto.quantidade} x R${" "}
                  {produto.preco?.toFixed(2) || "0.00"} = R${" "}
                  {(produto.quantidade * produto.preco).toFixed(2)}
                </Text>
              </View>
            ))}

            {order.desconto?.valor && (
              <>
                <Text style={styles.detailLabel}>Desconto:</Text>
                <Text style={styles.detailValue}>
                  {order.desconto.tipo === "percentual"
                    ? `${order.desconto.valor}%`
                    : `R$ ${order.desconto.valor}`}
                </Text>
              </>
            )}

            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              R$ {order.total?.toFixed(2) || "0.00"}
            </Text>

            {order.observacoes && (
              <>
                <Text style={styles.detailLabel}>Observações:</Text>
                <Text style={styles.detailValue}>{order.observacoes}</Text>
              </>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: "90%",
    width: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 14,
  },
  exportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  exportButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 14,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  produtoDetail: {
    backgroundColor: "#f8f8f8",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  produtoDetailName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  produtoDetailVariation: {
    fontSize: 13,
    color: "#FF9800",
    fontStyle: "italic",
    marginTop: 2,
    marginBottom: 3,
  },
  produtoDetailInfo: {
    fontSize: 14,
    color: "#666",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
  },
  closeButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  closeButtonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },
});

export default OrderDetailsModal;