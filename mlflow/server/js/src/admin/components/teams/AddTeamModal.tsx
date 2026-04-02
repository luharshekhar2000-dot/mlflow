import { useState, useCallback, useMemo } from 'react';
import { Input, Modal, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { AddTeamFormValues } from '../../types';

interface AddTeamModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (values: AddTeamFormValues) => void;
}

const INITIAL_FORM: AddTeamFormValues = { name: '', description: '' };

export const AddTeamModal = ({ open, onClose, onSuccess }: AddTeamModalProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [form, setForm] = useState<AddTeamFormValues>(INITIAL_FORM);

  const handleClose = useCallback(() => {
    setForm(INITIAL_FORM);
    onClose();
  }, [onClose]);

  const isValid = useMemo(() => form.name.trim().length > 0, [form.name]);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    onSuccess(form);
    handleClose();
  }, [isValid, form, onSuccess, handleClose]);

  return (
    <Modal
      componentId="mlflow.admin.add-team-modal"
      title={intl.formatMessage({ defaultMessage: 'Create Team', description: 'Create team modal title' })}
      visible={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText={intl.formatMessage({ defaultMessage: 'Create', description: 'Create team confirm button' })}
      cancelText={intl.formatMessage({ defaultMessage: 'Cancel', description: 'Cancel button' })}
      okButtonProps={{ disabled: !isValid }}
      size="normal"
    >
      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Typography.Text bold>
            <FormattedMessage defaultMessage="Team Name" description="Create team modal - name label" />
          </Typography.Text>
          <Input
            componentId="mlflow.admin.add-team-modal.name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={intl.formatMessage({
              defaultMessage: 'e.g. ML Engineers',
              description: 'Team name placeholder',
            })}
          />
        </div>

        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <Typography.Text bold>
            <FormattedMessage
              defaultMessage="Description (optional)"
              description="Create team modal - description label"
            />
          </Typography.Text>
          <Input
            componentId="mlflow.admin.add-team-modal.description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={intl.formatMessage({
              defaultMessage: 'Describe the purpose of this team',
              description: 'Team description placeholder',
            })}
          />
        </div>
      </div>
    </Modal>
  );
};
