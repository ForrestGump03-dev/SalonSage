export interface LicenseInfo {
  isValid: boolean;
  features: string[];
  expiryDate?: Date;
}

export class LicenseManager {
  private static instance: LicenseManager;
  private licenseInfo: LicenseInfo | null = null;

  private constructor() {}

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  async validateLicense(key: string): Promise<LicenseInfo> {
    try {
      const response = await fetch('/api/license/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        throw new Error('License validation failed');
      }

      const data = await response.json();
      this.licenseInfo = {
        isValid: data.isValid,
        features: data.features || [],
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      };

      return this.licenseInfo;
    } catch (error) {
      console.error('License validation error:', error);
      this.licenseInfo = {
        isValid: false,
        features: [],
      };
      return this.licenseInfo;
    }
  }

  getLicenseInfo(): LicenseInfo | null {
    return this.licenseInfo;
  }

  hasFeature(feature: string): boolean {
    return this.licenseInfo?.features.includes(feature) || false;
  }

  isFullVersion(): boolean {
    return this.hasFeature('full_access');
  }

  canAccessAnalytics(): boolean {
    return this.hasFeature('analytics');
  }

  hasUnlimitedClients(): boolean {
    return this.hasFeature('unlimited_clients');
  }

  getDemoLimitations(): { maxClients: number; maxBookings: number } {
    if (this.isFullVersion()) {
      return { maxClients: Infinity, maxBookings: Infinity };
    }
    return { maxClients: 10, maxBookings: 50 };
  }
}

export const licenseManager = LicenseManager.getInstance();
