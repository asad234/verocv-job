import * as migration_20260412_235316 from './20260412_235316';
import * as migration_20261119_025131_add_admin_avatar from './20261119_025131_add_admin_avatar';

export const migrations = [
  {
    up: migration_20260412_235316.up,
    down: migration_20260412_235316.down,
    name: '20260412_235316',
  },
  {
    up: migration_20261119_025131_add_admin_avatar.up,
    down: migration_20261119_025131_add_admin_avatar.down,
    name: '20261119_025131_add_admin_avatar'
  },
];
