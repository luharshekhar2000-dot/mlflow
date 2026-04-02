import { Modal, Typography } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { Team } from '../../types';

interface DeleteTeamModalProps {
  open: boolean;
  team: Team | null;
  onClose: () => void;
  onSuccess: (teamId: string) => void;
}

export const DeleteTeamModal = ({ open, team, onClose, onSuccess }: DeleteTeamModalProps) => {
  const intl = useIntl();

  const handleOk = () => {
    if (team) {
      onSuccess(team.id);
      onClose();
    }
  };

  return (
    <Modal
      componentId="mlflow.admin.delete-team-modal"
      title={intl.formatMessage({ defaultMessage: 'Delete Team', description: 'Delete team modal title' })}
      visible={open}
      onCancel={onClose}
      onOk={handleOk}
      okText={intl.formatMessage({ defaultMessage: 'Delete', description: 'Delete team confirm button' })}
      cancelText={intl.formatMessage({ defaultMessage: 'Cancel', description: 'Cancel button' })}
      danger
      size="normal"
    >
      {team && (
        <Typography.Text>
          <FormattedMessage
            defaultMessage="Are you sure you want to delete team {name}? Members will lose the permissions granted through this team."
            description="Confirmation message for deleting a team"
            values={{ name: <strong>{team.name}</strong> }}
          />
        </Typography.Text>
      )}
    </Modal>
  );
};
