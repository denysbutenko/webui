import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Job } from 'app/interfaces/job.interface';
import { BwLimit, BwLimitUpdate, CloudCredential } from './cloud-sync-task.interface';
import { Schedule } from './schedule.interface';

export interface CloudBackup {
  id: number;
  description: string;
  path: string;
  attributes: Record<string, string | number | boolean>;
  schedule: Schedule;
  pre_script: string;
  post_script: string;
  snapshot: boolean;
  include: string[];
  exclude: string[];
  transfers: number | null;
  args: string;
  enabled: boolean;
  password: string;
  credentials: CloudCredential;
  job: Job | null;
  locked: boolean;
  bwlimit?: BwLimit[];
  keep_last?: number;
}

export interface CloudBackupUpdate extends Omit<CloudBackup, 'id' | 'job' | 'locked' | 'bwlimit' | 'credentials'> {
  credentials: number;
  bwlimit: BwLimitUpdate[];
}

export interface CloudBackupSnapshot {
  id: string;
  short_id: string;
  hostname: string;
  paths: string[];
  parent: string;
  username: string;
  time: {
    $date: number;
  };
  tree: string;
  program_version: string;
}

export enum SnapshotIncludeExclude {
  IncludeEverything = 'includeEverything',
  IncludeFromSubFolder = 'includeFromSubFolder',
  ExcludePaths = 'excludePaths',
  ExcludeByPattern = 'excludeByPattern',
}

export type CloudBackupRestoreParams = [
  id: number,
  snapshot_id: string,
  subfolder: string,
  destination_path: string,
  settings: {
    exclude: string[];
    include?: string[];
  },
];

export enum CloudBackupSnapshotDirectoryFileType {
  File = 'file',
  Dir = 'dir',
}

export type CloudBackupSnapshotDirectoryParams = [
  id: number,
  snapshot_id: string,
  path: string,
];

export interface CloudBackupSnapshotDirectoryListing {
  name: string;
  path: string;
  type: CloudBackupSnapshotDirectoryFileType;
}

export interface BackupTile {
  title: string;
  totalSend: number;
  totalReceive: number;
  failedSend: number;
  failedReceive: number;
  lastWeekSend: number;
  lastWeekReceive: number;
  lastSuccessfulTask: ApiTimestamp;
}
