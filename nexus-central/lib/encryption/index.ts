import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY) {
  console.warn('ENCRYPTION_KEY not set - using default (INSECURE for production)');
}

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export function encryptDatabaseConfig(config: DatabaseConfig): string {
  return encrypt(JSON.stringify(config));
}

export function decryptDatabaseConfig(encryptedConfig: string): DatabaseConfig {
  try {
    return JSON.parse(decrypt(encryptedConfig));
  } catch (error) {
    console.error('Failed to decrypt database config:', error);
    throw new Error('Invalid database configuration');
  }
}

export function generateCompanyCode(): string {
  const adjectives = ['FAST', 'TECH', 'SMART', 'NEXT', 'PRIME', 'APEX', 'NOVA', 'SYNC'];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  
  return `${randomAdj}-${randomNum}`;
}

export function generateMachineId(cpuInfo: string, macAddress: string): string {
  const combined = `${cpuInfo}-${macAddress}`;
  return CryptoJS.SHA256(combined).toString();
}