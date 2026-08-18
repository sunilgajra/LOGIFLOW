import { ICourierProvider } from './CourierProvider';
import { DelhiveryProvider } from './DelhiveryProvider';
import { BlueDartProvider } from './BlueDartProvider';
import { MockCourierProvider } from './MockCourierProvider';

export class CourierFactory {
  /**
   * Initializes and returns the correct Courier Provider based on the database record.
   * @param courierName Name of the courier partner
   * @param apiCredentials JSON string of credentials from the database
   */
  static getProvider(courierName: string, apiCredentials: string | null): ICourierProvider {
    const normalizedName = (courierName || '').toLowerCase();

    if (normalizedName.includes('delhivery')) {
      return new DelhiveryProvider(apiCredentials);
    }
    
    if (normalizedName.includes('bluedart') || normalizedName.includes('blue dart')) {
      return new BlueDartProvider(apiCredentials);
    }

    // Default simulation / mock provider for custom or unintegrated courier partners
    return new MockCourierProvider(courierName, apiCredentials);
  }
}

