import https from 'https';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { storage } from './storage';

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export class AutoUpdater {
  private updateUrl: string;
  private currentVersion: string;
  private checkInterval: number = 60 * 60 * 1000; // 1 ora
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.updateUrl = process.env.AUTO_UPDATE_URL || "";
    this.currentVersion = process.env.CURRENT_VERSION || "1.0.0";
    this.startPeriodicCheck();
  }

  private startPeriodicCheck() {
    // Controlla aggiornamenti ogni ora
    this.intervalId = setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);

    // Controlla immediatamente all'avvio
    setTimeout(() => this.checkForUpdates(), 30000); // Aspetta 30 secondi dopo l'avvio
  }

  async checkForUpdates(): Promise<{ hasUpdate: boolean; version?: string; downloadUrl?: string }> {
    try {
      if (!this.updateUrl) {
        console.log('URL di aggiornamento non configurato');
        return { hasUpdate: false };
      }

      console.log('🔍 Controllo aggiornamenti...');
      const latestRelease = await this.getLatestRelease();
      
      if (!latestRelease) {
        return { hasUpdate: false };
      }

      const hasUpdate = this.compareVersions(latestRelease.tag_name, this.currentVersion) > 0;
      
      if (hasUpdate) {
        console.log(`📦 Nuovo aggiornamento disponibile: ${latestRelease.tag_name}`);
        await storage.setAppMetadata('latest_version', latestRelease.tag_name);
        await storage.setAppMetadata('update_available', 'true');
        await storage.setAppMetadata('update_checked_at', new Date().toISOString());
        
        // Trova l'asset di download appropriato
        const downloadAsset = latestRelease.assets.find(asset => 
          asset.name.includes('salon-sage') || asset.name.includes('.zip')
        );

        return {
          hasUpdate: true,
          version: latestRelease.tag_name,
          downloadUrl: downloadAsset?.browser_download_url
        };
      } else {
        console.log('✅ Applicazione aggiornata alla versione più recente');
        await storage.setAppMetadata('update_available', 'false');
        await storage.setAppMetadata('update_checked_at', new Date().toISOString());
        return { hasUpdate: false };
      }
    } catch (error) {
      console.error('❌ Errore nel controllo aggiornamenti:', error);
      return { hasUpdate: false };
    }
  }

  private getLatestRelease(): Promise<GitHubRelease | null> {
    return new Promise((resolve, reject) => {
      const request = https.get(this.updateUrl, {
        headers: {
          'User-Agent': 'SalonSage-AutoUpdater',
          'Accept': 'application/vnd.github.v3+json'
        }
      }, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const release = JSON.parse(data) as GitHubRelease;
            resolve(release);
          } catch (error) {
            reject(error);
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Timeout nella richiesta di aggiornamento'));
      });
    });
  }

  private compareVersions(version1: string, version2: string): number {
    // Rimuove il prefisso 'v' se presente
    const v1 = version1.replace(/^v/, '').split('.').map(Number);
    const v2 = version2.replace(/^v/, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }

  async downloadAndInstallUpdate(downloadUrl: string): Promise<boolean> {
    try {
      console.log('📥 Scaricamento aggiornamento in corso...');
      
      const updateDir = path.join(process.cwd(), 'updates');
      if (!fs.existsSync(updateDir)) {
        fs.mkdirSync(updateDir, { recursive: true });
      }

      const fileName = path.basename(downloadUrl);
      const filePath = path.join(updateDir, fileName);

      // Scarica il file
      await this.downloadFile(downloadUrl, filePath);
      
      console.log('✅ Aggiornamento scaricato con successo');
      
      // Crea uno script di installazione
      await this.createInstallScript(filePath);
      
      console.log('🔄 Riavvio per installare l\'aggiornamento...');
      
      // Programma il riavvio con l'installazione
      setTimeout(() => {
        process.exit(0); // L'app si riavvierà automaticamente con PM2 o simili
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('❌ Errore nell\'installazione dell\'aggiornamento:', error);
      return false;
    }
  }

  private downloadFile(url: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      
      const request = https.get(url, (response) => {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
      });

      request.on('error', (error) => {
        fs.unlink(filePath, () => {}); // Rimuove il file parziale
        reject(error);
      });

      file.on('error', (error) => {
        fs.unlink(filePath, () => {}); // Rimuove il file parziale
        reject(error);
      });
    });
  }

  private async createInstallScript(updateFilePath: string): Promise<void> {
    const scriptPath = path.join(process.cwd(), 'install-update.bat');
    const backupDir = path.join(process.cwd(), 'backup');
    
    const script = `
@echo off
echo Installazione aggiornamento SalonSage...

REM Crea backup
if not exist "${backupDir}" mkdir "${backupDir}"
xcopy /E /I /Y . "${backupDir}" /EXCLUDE:exclude.txt

REM Estrai aggiornamento
powershell -command "Expand-Archive -Path '${updateFilePath}' -DestinationPath '.' -Force"

REM Riavvia l'applicazione
echo Aggiornamento completato. Riavvio dell'applicazione...
npm start

del "%~f0"
`;

    fs.writeFileSync(scriptPath, script.trim());
    
    // Crea file di esclusione per il backup
    const excludeList = [
      'node_modules\\*',
      'updates\\*',
      'backup\\*',
      '*.log',
      'salon_sage.db*'
    ];
    
    fs.writeFileSync(
      path.join(process.cwd(), 'exclude.txt'),
      excludeList.join('\n')
    );
  }

  async getUpdateStatus(): Promise<{
    updateAvailable: boolean;
    currentVersion: string;
    latestVersion?: string;
    lastChecked?: string;
  }> {
    const updateAvailable = await storage.getAppMetadata('update_available') === 'true';
    const latestVersion = await storage.getAppMetadata('latest_version');
    const lastChecked = await storage.getAppMetadata('update_checked_at');

    return {
      updateAvailable,
      currentVersion: this.currentVersion,
      latestVersion: latestVersion || undefined,
      lastChecked: lastChecked || undefined
    };
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Singleton instance
export const autoUpdater = new AutoUpdater();
