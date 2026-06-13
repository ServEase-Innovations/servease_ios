/**
 * Copy to devApi.local.ts (gitignored) and set your Mac LAN IP when testing utils locally on a physical device.
 *
 * export const DEV_LAN_HOST = "192.168.1.42";
 *
 * Without this file, physical devices use production utils (https://utils-jo6c.onrender.com).
 */

export const DEV_LAN_HOST: string | null = null;
