declare module 'youtube-transcript-api' {
  export interface TranscriptResponse {
    text: string;
    duration: number;
    offset: number;
  }

  export interface RequestConfig {
    headers?: Record<string, string>;
    timeout?: number;
    [key: string]: unknown;
  }

  export class TranscriptAPI {
    static getTranscript(videoId: string, config?: RequestConfig): Promise<TranscriptResponse[]>;
  }

  const api: {
    getTranscript: typeof TranscriptAPI.getTranscript;
  };

  export default api;
}
