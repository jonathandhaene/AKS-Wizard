import { WizardProvider, useWizard } from './contexts/WizardContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Welcome } from './steps/Welcome';
import { MaturityAssessment } from './steps/MaturityAssessment';
import { ClusterBasics } from './steps/ClusterBasics';
import { NodePools } from './steps/NodePools';
import { WorkloadRequirements } from './steps/WorkloadRequirements';
import { Pods } from './steps/Pods';
import { Networking } from './steps/Networking';
import { Security } from './steps/Security';
import { Monitoring } from './steps/Monitoring';
import { Addons } from './steps/Addons';
import { Storage } from './steps/Storage';
import { Review } from './steps/Review';
import { Templates } from './steps/Templates';
import { Deploy } from './steps/Deploy';
import { GitHub } from './steps/GitHub';

const STEP_COMPONENTS = [
  Welcome,
  MaturityAssessment,
  ClusterBasics,
  NodePools,
  WorkloadRequirements,
  Pods,
  Networking,
  Security,
  Monitoring,
  Addons,
  Storage,
  Review,
  Templates,
  Deploy,
  GitHub,
];

function WizardRouter() {
  const { currentStepIndex } = useWizard();
  const StepComponent = STEP_COMPONENTS[currentStepIndex];
  return <StepComponent />;
}

function App() {
  return (
    <ThemeProvider>
      <WizardProvider>
        <WizardRouter />
      </WizardProvider>
    </ThemeProvider>
  );
}

export default App;
