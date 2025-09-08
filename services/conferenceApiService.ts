import { ApiAgendaResponse } from '../types/apiSchemas';
import { transformApiResponse, autoDetectTransformer } from './apiTransformers';

export interface FetchOptions {
    timeout?: number;
    headers?: Record<string, string>;
    retries?: number;
}

export interface SyncResult {
    success: boolean;
    data?: ApiAgendaResponse;
    error?: string;
    statusCode?: number;
}

class ConferenceApiService {
    private readonly defaultTimeout = 10000; // 10 seconds
    private readonly defaultRetries = 2;

    /**
     * Fetches conference agenda data from the provided API URL
     */
    async fetchConferenceAgenda(
        apiUrl: string,
        transformerId?: string,
        options: FetchOptions = {}
    ): Promise<SyncResult> {
        const { timeout = this.defaultTimeout, headers = {}, retries = this.defaultRetries } = options;

        if (!this.isValidUrl(apiUrl)) {
            return {
                success: false,
                error: 'Invalid API URL format',
                statusCode: 400,
            };
        }

        let lastError: string = '';
        let statusCode: number = 0;

        // Retry logic
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`Fetching conference data from ${apiUrl} (attempt ${attempt + 1}/${retries + 1})`);
                
                // Create fetch request with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        ...headers,
                    },
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                statusCode = response.status;

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const rawData = await response.json();
                
                // Validate the response
                if (!this.validateApiResponse(rawData)) {
                    throw new Error('Invalid API response structure');
                }

                // Auto-detect transformer if not specified
                const detectedTransformer = transformerId || autoDetectTransformer(rawData);
                console.log(`Using transformer: ${detectedTransformer}`);

                // Transform the data
                const transformedData = transformApiResponse(rawData, detectedTransformer);

                return {
                    success: true,
                    data: transformedData,
                };

            } catch (error: any) {
                console.error(`Fetch attempt ${attempt + 1} failed:`, error);
                
                if (error.name === 'AbortError') {
                    lastError = `Request timeout after ${timeout}ms`;
                } else if (error.message?.includes('Network request failed')) {
                    lastError = 'Network error - please check your internet connection';
                } else if (error.message?.includes('HTTP')) {
                    lastError = error.message;
                    statusCode = parseInt(error.message.match(/HTTP (\d+)/)?.[1] || '0');
                } else {
                    lastError = error.message || 'Unknown error occurred';
                }

                // Don't retry on certain errors
                if (statusCode === 404 || statusCode === 401 || statusCode === 403) {
                    break;
                }

                // Wait before retry (exponential backoff)
                if (attempt < retries) {
                    await this.delay(1000 * Math.pow(2, attempt));
                }
            }
        }

        return {
            success: false,
            error: lastError,
            statusCode,
        };
    }

    /**
     * Validates if the API response has the minimum required structure
     */
    private validateApiResponse(data: any): boolean {
        if (!data) {
            return false;
        }

        // Check for various common structures
        const hasTalks = data.talks && Array.isArray(data.talks);
        const hasResults = data.results && Array.isArray(data.results);
        const isArray = Array.isArray(data);
        const hasSessions = data.sessions && Array.isArray(data.sessions);
        const hasEvents = data.events && Array.isArray(data.events);
        const hasSchedule = data.schedule && Array.isArray(data.schedule);

        return hasTalks || hasResults || isArray || hasSessions || hasEvents || hasSchedule;
    }

    /**
     * Validates URL format
     */
    private isValidUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * Delays execution for the specified number of milliseconds
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Tests an API endpoint to see if it's reachable and returns valid data
     */
    async testApiEndpoint(apiUrl: string, transformerId?: string): Promise<SyncResult> {
        return this.fetchConferenceAgenda(apiUrl, transformerId, {
            timeout: 5000, // Shorter timeout for testing
            retries: 1, // Fewer retries for testing
        });
    }

    /**
     * Gets information about an API endpoint without fully processing the data
     */
    async getApiInfo(apiUrl: string): Promise<{
        accessible: boolean;
        suggestedTransformer?: string;
        error?: string;
        responsePreview?: any;
    }> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return {
                    accessible: false,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            }

            const rawData = await response.json();
            const suggestedTransformer = autoDetectTransformer(rawData);

            // Create a preview of the response (first few items)
            let preview = rawData;
            if (Array.isArray(rawData) && rawData.length > 2) {
                preview = rawData.slice(0, 2);
            } else if (rawData.talks && Array.isArray(rawData.talks) && rawData.talks.length > 2) {
                preview = { ...rawData, talks: rawData.talks.slice(0, 2) };
            }

            return {
                accessible: true,
                suggestedTransformer,
                responsePreview: preview,
            };

        } catch (error: any) {
            return {
                accessible: false,
                error: error.message || 'Failed to access API endpoint',
            };
        }
    }
}

// Export singleton instance
export const conferenceApiService = new ConferenceApiService();
export default conferenceApiService;