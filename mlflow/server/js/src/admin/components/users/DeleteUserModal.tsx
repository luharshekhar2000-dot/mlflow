import { Modal, Typography } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { User } from '../../types';

interface DeleteUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: (userId: string) => void;
}

export const DeleteUserModal = ({ open, user, onClose, onSuccess }: DeleteUserModalProps) => {
  const intl = useIntl();

  const handleOk = () => {
    if (user) {
      onSuccess(user.id);
      onClose();
    }
  };

  return (
    <Modal
      componentId="mlflow.admin.delete-user-modal"
      title={intl.formatMessage({ defaultMessage: 'Remove User', description: 'Delete user modal title' })}
      visible={open}
      onCancel={onClose}
      onOk={handleOk}
      okText={intl.formatMessage({ defaultMessage: 'Remove', description: 'Remove user button' })}
      cancelText={intl.formatMessage({ defaultMessage: 'Cancel', description: 'Cancel button' })}
      danger
      size="normal"
    >
      {user && (
        <Typography.Text>
          <FormattedMessage
            defaultMessage="Are you sure you want to remove user {username}? This action cannot be undone."
            description="Confirmation message for deleting a user"
            values={{ username: <strong>{user.username}</strong> }}
          />
        </Typography.Text>
      )}
    </Modal>
  );
};
