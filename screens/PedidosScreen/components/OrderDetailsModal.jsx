import React, { memo, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Download, Edit, Trash2 } from "lucide-react-native";

const metodoPagamentoOptions = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
];

// Componente de produto memoizado
const ProductDetail = memo(({ produto, index }) => {
  const precoOriginal = produto.preco * produto.quantidade;
  
  const precoComDesconto = useMemo(() => {
    if (!produto.desconto?.valor) return precoOriginal;

    const valorDesconto = parseFloat(produto.desconto.valor.toString().replace(",", ".")) || 0;
    let desconto = 0;

    if (produto.desconto.tipo === "percentual") {
      desconto = (precoOriginal * valorDesconto) / 100;
    } else {
      desconto = valorDesconto;
    }

    return Math.max(0, precoOriginal - desconto);
  }, [produto.preco, produto.quantidade, produto.desconto]);

  return (
    <View style={styles.produtoDetail}>
      <Text style={styles.produtoDetailName}>{produto.nome}</Text>
      {produto.variacaoSelecionada && (
        <Text style={styles.produtoDetailVariation}>
          {produto.variacaoSelecionada.tipo === "cor" ? "Cor" : "Tamanho"}
          : {produto.variacaoSelecionada.valor}
        </Text>
      )}
      <Text style={styles.produtoDetailInfo}>
        Qtd: {produto.quantidade} x R$ {produto.preco?.toFixed(2) || "0.00"}
      </Text>
      {produto.desconto?.valor && (
        <Text style={styles.produtoDetailDiscount}>
          Desconto individual:{" "}
          {produto.desconto.tipo === "percentual"
            ? `${produto.desconto.valor}%`
            : `R$ ${produto.desconto.valor}`}
        </Text>
      )}
      <Text style={styles.produtoDetailTotal}>
        Subtotal: R$ {precoComDesconto.toFixed(2)}
      </Text>
    </View>
  );
});

ProductDetail.displayName = 'ProductDetail';

const OrderDetailsModal = ({
  visible,
  onClose,
  order,
  clientes,
  onExportPDF,
  onEditOrder,
  onDeleteOrder,
}) => {
  const handleExportWithOptions = useCallback(() => {
    Alert.alert(
      "Exportar PDF",
      "Como deseja gerar o PDF?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Com Descontos", onPress: () => onExportPDF(order, clientes, true) },
        { text: "Sem Descontos", onPress: () => onExportPDF(order, clientes, false) },
      ],
      { cancelable: true }
    );
  }, [order, clientes, onExportPDF]);

  const metodoPagamento = useMemo(() => {
    if (!order) return '';
    return metodoPagamentoOptions.find(m => m.value === order.metodoPagamento)?.label || order.metodoPagamento;
  }, [order?.metodoPagamento]);

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
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDeleteOrder(order)}
              >
                <Trash2 size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportWithOptions}
            >
              <Download size={20} color="#fff" />
              <Text style={styles.exportButtonText}>Exportar PDF</Text>
            </TouchableOpacity>

            <Text style={styles.detailLabel}>Cliente:</Text>
            <Text style={styles.detailValue}>{order.cliente}</Text>

            <Text style={styles.detailLabel}>Data:</Text>
            <Text style={styles.detailValue}>
              {new Date(order.data).toLocaleDateString("pt-BR")}
            </Text>

            <Text style={styles.detailLabel}>Método de Pagamento:</Text>
            <Text style={styles.detailValue}>{metodoPagamento}</Text>

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
              <ProductDetail key={index} produto={produto} index={index} />
            ))}

            {order.desconto?.valor && (
              <>
                <Text style={styles.detailLabel}>Desconto Geral:</Text>
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
    marginBottom: 20,
  },
  exportButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
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
    marginTop: 2,
  },
  produtoDetailDiscount: {
    fontSize: 13,
    color: "#4CAF50",
    fontStyle: "italic",
    marginTop: 4,
  },
  produtoDetailTotal: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2196F3",
    marginTop: 6,
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