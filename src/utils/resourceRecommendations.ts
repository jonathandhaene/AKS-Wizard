import type { WorkloadConfig, WorkloadType, TrafficLevel } from '../types/wizard';

// ─── VM SKU Recommendations ────────────────────────────────────────────────────

export interface VmSkuRecommendation {
  sku: string;
  description: string;
  reason: string;
}

const SKU_MAP: Record<WorkloadType, VmSkuRecommendation[]> = {
  general: [
    { sku: 'Standard_D4s_v3', description: '4 vCPU, 16 GiB RAM', reason: 'Balanced compute/memory for most workloads' },
    { sku: 'Standard_D8s_v3', description: '8 vCPU, 32 GiB RAM', reason: 'Scale-up option for heavier general workloads' },
  ],
  'memory-intensive': [
    { sku: 'Standard_E4s_v3', description: '4 vCPU, 32 GiB RAM', reason: 'High memory-to-CPU ratio for in-memory caches or analytics' },
    { sku: 'Standard_E8s_v3', description: '8 vCPU, 64 GiB RAM', reason: 'Large in-memory datasets and memory-heavy databases' },
  ],
  'compute-intensive': [
    { sku: 'Standard_F4s_v2', description: '4 vCPU, 8 GiB RAM', reason: 'High CPU frequency for batch processing and simulations' },
    { sku: 'Standard_F8s_v2', description: '8 vCPU, 16 GiB RAM', reason: 'CPU-bound workloads needing higher parallelism' },
  ],
  'gpu-heavy': [
    { sku: 'Standard_NC4as_T4_v3', description: '4 vCPU, 28 GiB RAM, 1× T4 GPU', reason: 'GPU acceleration for ML inference and graphics workloads' },
    { sku: 'Standard_NC6s_v3', description: '6 vCPU, 112 GiB RAM, 1× V100 GPU', reason: 'High-performance GPU for model training' },
  ],
  'io-intensive': [
    { sku: 'Standard_L4s', description: '4 vCPU, 32 GiB RAM, 678 GiB NVMe SSD', reason: 'Local NVMe storage for high-throughput I/O workloads' },
    { sku: 'Standard_L8s_v3', description: '8 vCPU, 64 GiB RAM, 1.92 TB NVMe SSD', reason: 'Large local SSD for data-intensive applications' },
  ],
};

export function getVmSkuRecommendations(workloadType: WorkloadType): VmSkuRecommendation[] {
  return SKU_MAP[workloadType];
}

// ─── Resource Requests / Limits ───────────────────────────────────────────────

export interface ResourceSpec {
  cpuRequest: string;
  memoryRequest: string;
  cpuLimit: string;
  memoryLimit: string;
}

function resourcesForTraffic(workloadType: WorkloadType, trafficLevel: TrafficLevel): ResourceSpec {
  const isMemory = workloadType === 'memory-intensive';
  const isCompute = workloadType === 'compute-intensive' || workloadType === 'gpu-heavy';

  const base: Record<TrafficLevel, ResourceSpec> = {
    low: {
      cpuRequest: '100m',
      memoryRequest: isMemory ? '512Mi' : '128Mi',
      cpuLimit: isCompute ? '500m' : '250m',
      memoryLimit: isMemory ? '1Gi' : '256Mi',
    },
    medium: {
      cpuRequest: '250m',
      memoryRequest: isMemory ? '1Gi' : '256Mi',
      cpuLimit: isCompute ? '1' : '500m',
      memoryLimit: isMemory ? '2Gi' : '512Mi',
    },
    high: {
      cpuRequest: '500m',
      memoryRequest: isMemory ? '2Gi' : '512Mi',
      cpuLimit: isCompute ? '2' : '1',
      memoryLimit: isMemory ? '4Gi' : '1Gi',
    },
    burst: {
      cpuRequest: '1',
      memoryRequest: isMemory ? '4Gi' : '1Gi',
      cpuLimit: isCompute ? '4' : '2',
      memoryLimit: isMemory ? '8Gi' : '2Gi',
    },
  };

  return base[trafficLevel];
}

// ─── YAML Generators ──────────────────────────────────────────────────────────

export function generateResourceYaml(cfg: WorkloadConfig): string {
  const res = resourcesForTraffic(cfg.workloadType, cfg.trafficLevel);
  const gpuBlock = cfg.workloadType === 'gpu-heavy'
    ? `\n          nvidia.com/gpu: "1"`
    : '';

  const hpaYaml = cfg.enableHpa ? `
---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: ${cfg.trafficLevel === 'low' ? 1 : 2}
  maxReplicas: ${cfg.trafficLevel === 'burst' ? 20 : cfg.trafficLevel === 'high' ? 10 : 5}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: ${cfg.targetCpuUtilization}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: ${cfg.targetMemoryUtilization}
` : '';

  const vpaYaml = cfg.enableVpa ? `
---
# Vertical Pod Autoscaler
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
  namespace: default
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
      - containerName: my-app
        minAllowed:
          cpu: ${res.cpuRequest}
          memory: ${res.memoryRequest}
        maxAllowed:
          cpu: ${res.cpuLimit}
          memory: ${res.memoryLimit}
` : '';

  const monitoringComment = cfg.enableMonitoringIntegration
    ? [
        '# Prometheus scraping annotations — add these to your Deployment\'s pod template metadata:',
        '# annotations:',
        '#   prometheus.io/scrape: "true"',
        '#   prometheus.io/port: "8080"',
        '#   prometheus.io/path: "/metrics"',
      ].join('\n')
    : '';

  return [
    '# Resource Configuration',
    '# Generated by AKS Configuration Wizard',
    `# Workload: ${cfg.workloadType} | Traffic: ${cfg.trafficLevel}`,
    ...(monitoringComment ? [monitoringComment] : []),
    `
---
# Example Deployment with recommended resource requests and limits
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
spec:
  replicas: ${cfg.trafficLevel === 'low' ? 1 : cfg.trafficLevel === 'burst' ? 4 : 2}
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: my-registry/my-app:latest
          resources:
            requests:
              cpu: "${res.cpuRequest}"
              memory: "${res.memoryRequest}"
            limits:
              cpu: "${res.cpuLimit}"
              memory: "${res.memoryLimit}"${gpuBlock}
${hpaYaml}${vpaYaml}`,
  ].join('\n');
}
