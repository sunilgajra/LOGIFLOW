import { ICourierProvider } from './CourierProvider';
import { MockCourierProvider } from './DelhiveryProvider';

export class CourierFactory {
  /**
   * Initializes and returns the correct Courier Provider based on the database record.
   * @param courierName Name of the courier partner
   * @param apiCredentials JSON string of credentials from the database
   */
  static getProvider(courierName: string, apiCredentials: string | null): ICourierProvider {
    const normalizedName = courierName.toLowerCase();

    // Here we would conditionally return real providers. 
    // Since we are in simulation mode for now, we return the mock for everyone.
    
    /* Example of real logic:
    if (normalizedName.includes('delhivery')) {
      return new DelhiveryLiveProvider(apiCredentials);
    } else if (normalizedName.includes('bluedart')) {
      return new BlueDartLiveProvider(apiCredentials);
    }
    */

    // Return the simulation provider
    return new MockCourierProvider(courierName, apiCredentials);
  }
}
