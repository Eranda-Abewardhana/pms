import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

const ConfirmDialog = ({ open, title, content, onConfirm, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">{t('cancel')}</Button>
        <Button onClick={onConfirm} color="primary" variant="contained">{t('confirm')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
