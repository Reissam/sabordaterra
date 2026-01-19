import MasterAuthWrapper from '../../../../src/components/MasterAuthWrapper';
import MasterPanel from '../../../../src/components/MasterPanel';

export default function MasterDashboardPage() {
  return (
    <MasterAuthWrapper>
      <MasterPanel />
    </MasterAuthWrapper>
  );
}
