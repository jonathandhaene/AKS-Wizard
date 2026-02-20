import { WizardProvider, useWizard } from './contexts/WizardContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Welcome } from './steps/Welcome';
import { ClusterBasics } from './steps/ClusterBasics';
import { NodePools } from './steps/NodePools';
import { Networking } from './steps/Networking';
import { Security } from './steps/Security';
import { Monitoring } from './steps/Monitoring';
import { Addons } from './steps/Addons';
import { Review } from './steps/Review';
import { Templates } from './steps/Templates';
import { Deploy } from './steps/Deploy';
import { GitHub } from './steps/GitHub';

const STEP_COMPONENTS = [
  Welcome,
  ClusterBasics,
  NodePools,
  Networking,
  Security,
  Monitoring,
  Addons,
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
