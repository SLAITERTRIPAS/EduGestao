import React from 'react';
import { Card, Button } from './ui';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, onConfirm, onCancel
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60  animate-fadeIn">
      <Card className="max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>Confirmar</Button>
        </div>
      </Card>
    </div>
  );
};
