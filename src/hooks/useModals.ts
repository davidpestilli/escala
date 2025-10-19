import { useState } from 'react';
import { ConfirmModalData, ConfirmModalType } from '../types';

export const useModals = () => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<ConfirmModalData>({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    onConfirm: () => {},
    onCancel: () => {},
    type: 'warning'
  });

  // Função para mostrar modal de confirmação
  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: ConfirmModalType = 'warning'
  ) => {
    setConfirmModalData({
      title,
      message,
      confirmText: type === 'danger' ? 'Excluir' : 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        onConfirm();
        setShowConfirmModal(false);
      },
      onCancel: () => setShowConfirmModal(false),
      type
    });
    setShowConfirmModal(true);
  };

  // Função para mostrar alert (modal sem botão cancelar)
  const showAlert = (
    title: string, 
    message: string, 
    type: ConfirmModalType = 'info'
  ) => {
    setConfirmModalData({
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      onConfirm: () => setShowConfirmModal(false),
      onCancel: () => setShowConfirmModal(false),
      type
    });
    setShowConfirmModal(true);
  };

  return {
    showConfirmModal,
    setShowConfirmModal,
    confirmModalData,
    setConfirmModalData,
    showConfirm,
    showAlert
  };
};