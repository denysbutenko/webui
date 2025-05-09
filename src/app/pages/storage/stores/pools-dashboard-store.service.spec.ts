import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Disk, DiskTemperatureAgg, StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { ScrubTask } from 'app/interfaces/pool-scrub.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { StorageService } from 'app/services/storage.service';

const temperatureAgg = {
  sda: { min: 10, max: 30, avg: 20 },
  sdd: { min: 20, max: 50, avg: 40 },
} as DiskTemperatureAgg;

const disk: Disk = {
  advpowermgmt: DiskPowerLevel.Disabled,
  bus: DiskBus.Spi,
  description: '',
  devname: 'sdd',
  duplicate_serial: [],
  expiretime: '',
  hddstandby: DiskStandby.AlwaysOn,
  identifier: '{uuid}b3ba146f-1ab6-4a45-ae6b-37ea00baf0aa',
  model: 'VMware_Virtual_S',
  name: 'sdd',
  number: 2096,
  pool: 'lio',
  rotationrate: 0,
  serial: '',
  size: 5368709120,
  subsystem: 'scsi',
  transfermode: 'Auto',
  type: DiskType.Hdd,
  zfs_guid: '12387051346845729003',
};

const disks: Disk[] = [
  { ...disk },
];

const dashboardDisks: StorageDashboardDisk[] = [
  {
    ...disk,
    alerts: [],
    tempAggregates: { min: 20, max: 50, avg: 40 },
  },
];

describe('PoolsDashboardStore', () => {
  const websocketSubscription$ = new Subject<ApiEvent<Pool>>();
  let spectator: SpectatorService<PoolsDashboardStore>;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: PoolsDashboardStore,
    providers: [
      StorageService,
      mockProvider(ApiService, {
        subscribe: jest.fn(() => websocketSubscription$),
      }),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
  });

  it('loads pool topology and root datasets and sets loading indicators when loadNodes is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const mockedApi = spectator.inject(ApiService);
      const pools = [
        { id: 1, name: 'pool1' },
        { id: 2, name: 'pool2' },
      ] as Pool[];
      const rootDatasets = [
        { id: 'pool1' },
        { id: 'pool2' },
      ] as Dataset[];
      const scrubs = [
        { pool: 1 },
        { pool: 2 },
      ] as ScrubTask[];
      jest.spyOn(mockedApi, 'call').mockImplementation((method: string) => {
        switch (method) {
          case 'pool.dataset.query':
            return cold('-a|', { a: rootDatasets });
          case 'pool.scrub.query':
            return cold('-a|', { a: scrubs });
          case 'disk.query':
            return cold('-a|', { a: [...disks] });
          case 'disk.temperature_alerts':
            return cold('-a|', { a: [] });
          case 'disk.temperature_agg':
            return cold('-a|', { a: { ...temperatureAgg } });
          default:
            throw new Error(`Unexpected method: ${method}`);
        }
      });
      jest.spyOn(mockedApi, 'callAndSubscribe').mockImplementation((method: string) => {
        if (method === 'pool.query') {
          return cold('-a|', { a: pools });
        }
        throw new Error(`Unexpected method: ${method}`);
      });

      spectator.service.loadDashboard();

      expectObservable(spectator.service.state$).toBe('ab-c', {
        a: {
          arePoolsLoading: true,
          isLoadingPoolDetails: true,
          pools: [],
          rootDatasets: {},
          disks: [],
          scrubs: [],
        },
        b: {
          arePoolsLoading: false,
          isLoadingPoolDetails: true,
          pools: [
            { id: 1, name: 'pool1' },
            { id: 2, name: 'pool2' },
          ],
          rootDatasets: {
            pool1: { id: 'pool1' },
            pool2: { id: 'pool2' },
          },
          disks: [],
          scrubs: [],
        },
        c: {
          arePoolsLoading: false,
          isLoadingPoolDetails: false,
          pools: [
            { id: 1, name: 'pool1' },
            { id: 2, name: 'pool2' },
          ],
          rootDatasets: {
            pool1: { id: 'pool1' },
            pool2: { id: 'pool2' },
          },
          disks: [...dashboardDisks],
          scrubs,
        },
      });
    });
  });
});
