import { useState, useCallback, useMemo } from 'react';
import {
  Checkbox,
  Input,
  Modal,
  SimpleSelect,
  SimpleSelectOption,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { AddUserFormValues, WorkspaceRole } from '../../types';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (values: AddUserFormValues) => void;
}

const INITIAL_FORM: AddUserFormValues = {
  username: '',
  email: '',
  workspace_role: 'viewer',
  is_admin: false,
};

export const AddUserModal = ({ open, onClose, onSuccess }: AddUserModalProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [form, setForm] = useState<AddUserFormValues>(INITIAL_FORM);

  const handleClose = useCallback(() => {
    setForm(INITIAL_FORM);
    onClose();
  }, [onClose]);

  const isValid = useMemo(
    () => form.username.trim().length > 0 && form.email.trim().length > 0,
    [form.username, form.email],
  );

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    onSuccess(form);
    handleClose();
  }, [isValid, form, onSuccess, handleClose]);

  return (
    <Modal
      componentId="mlflow.admin.add-user-modal"
      title={intl.formatMessage({ defaultMessage: 'Add User', description: 'Add user modal title' })}
      visible={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText={intl.formatMessage({ defaultMessage: 'Add', description: 'Add user modal confirm button' })}
      cancelText={intl.formatMessage({ defaultMessage: 'Cancel', description: 'Cancel button' })}
      okButtonProps={{ disabled: !isValid }}
      size="normal"
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Typography.Text bold>
            <FormattedMessage defaultMessage="Username" description="Add user modal - username label" />
          </Typography.Text>
          <Input
            componentId="mlflow.admin.add-user-modal.username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            placeholder={intl.formatMessage({ defaultMessage: 'e.g. johndoe', description: 'Username placeholder' })}
          />
        </div>

        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Typography.Text bold>
            <FormattedMessage defaultMessage="Email" description="Add user modal - email label" />
          </Typography.Text>
          <Input
            componentId="mlflow.admin.add-user-modal.email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder={intl.formatMessage({
              defaultMessage: 'e.g. john@example.com',
              description: 'Email placeholder',
            })}
            type="email"
          />
        </div>

        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Typography.Text bold>
            <FormattedMessage defaultMessage="Workspace Role" description="Add user modal - workspace role label" />
          </Typography.Text>
          <SimpleSelect
            id="add-user-workspace-role"
            componentId="mlflow.admin.add-user-modal.workspace-role"
            value={form.workspace_role}
            onChange={({ target }) => setForm((prev) => ({ ...prev, workspace_role: target.value as WorkspaceRole }))}
          >
            <SimpleSelectOption value="admin">Admin – full control</SimpleSelectOption>
            <SimpleSelectOption value="editor">Editor – can edit experiments and models</SimpleSelectOption>
            <SimpleSelectOption value="viewer">Viewer – read-only access</SimpleSelectOption>
            <SimpleSelectOption value="no_permissions">No permissions</SimpleSelectOption>
          </SimpleSelect>
        </div>

        <Checkbox
          componentId="mlflow.admin.add-user-modal.is-admin"
          isChecked={form.is_admin}
          onChange={(e) => setForm((prev) => ({ ...prev, is_admin: e.target.checked }))}
        >
          <FormattedMessage
            defaultMessage="Grant administrator privileges"
            description="Checkbox label for granting admin privileges"
          />
        </Checkbox>
      </div>
    </Modal>
  );
};
