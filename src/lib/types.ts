export type AgentId = 'codex' | 'claude';
export type Scope = 'project' | 'global';

export interface DetectionResult {
  id: AgentId;
  confidence: number;
  version?: string;
  signals: {
    executable?: string;
    versionCommand?: string;
    configPaths: string[];
  };
  warnings: string[];
}

export interface ManagedFile {
  path: string;
  sha256: string;
}

export interface BackupRecord {
  originalPath: string;
  backupPath: string;
}

export interface InstallReceipt {
  schemaVersion: 1;
  packageVersion: string;
  installedAt: string;
  scope: Scope;
  root: string;
  adapters: Record<string, { version: string; files: string[] }>;
  managedFiles: ManagedFile[];
  backups: BackupRecord[];
  generatedArtifacts: string[];
}

export interface InstallOptions {
  projectRoot: string;
  scope: Scope;
  agents: AgentId[];
  dryRun?: boolean;
  force?: boolean;
}

export interface DoctorCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface ProjectAnalysis {
  schemaVersion: '1.0';
  projectRoot: string;
  project: {
    framework: string;
    packageManager: string;
    styling: string[];
    componentLibraries: string[];
    animationLibraries: string[];
    confidence: number;
  };
  routes: string[];
  assets: { fonts: string[]; icons: string[]; images: string[]; threeD: string[] };
  candidates: {
    cssVariables: Array<{ name: string; value: string; count: number }>;
    colors: Array<{ value: string; count: number }>;
    spacing: Array<{ value: string; count: number }>;
    radii: Array<{ value: string; count: number }>;
    fontSizes: Array<{ value: string; count: number }>;
    shadows: Array<{ value: string; count: number }>;
    motion: Array<{ value: string; count: number }>;
  };
  evidence: Array<{ kind: string; path: string; confidence: number }>;
  warnings: string[];
}
