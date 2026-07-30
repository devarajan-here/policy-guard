export interface Message {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface ChatCompletionOptions {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  apiKey?: string;
}

export interface ModelInfo {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

const DEFAULT_BASE_URL = process.env.KONSOLE_BASE_URL || 'https://api.konsole.one/v1';
const DEFAULT_MODEL = process.env.KONSOLE_MODEL_ID || 'e30061c0dbd41052cc6f849b42e9ca8112170d9ef43ce7fde9f89faf86eee207';

export function getKonsoleConfig() {
  return {
    baseUrl: process.env.KONSOLE_BASE_URL || DEFAULT_BASE_URL,
    defaultModel: process.env.KONSOLE_MODEL_ID || DEFAULT_MODEL,
    hasServerApiKey: Boolean(process.env.KONSOLE_API_KEY && process.env.KONSOLE_API_KEY.trim() !== ''),
  };
}

export async function fetchKonsoleModels(apiKey?: string): Promise<{ success: boolean; models?: ModelInfo[]; error?: string }> {
  const token = apiKey || process.env.KONSOLE_API_KEY;
  if (!token) {
    return { success: false, error: 'No API Key configured. Please enter an API key in settings or set KONSOLE_API_KEY in .env.local.' };
  }

  try {
    const res = await fetch(`${DEFAULT_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-App-Key': token,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error || jsonErr.message || errText;
      } catch {
        // use raw text
      }
      return { success: false, error: `API HTTP ${res.status}: ${parsedErr}` };
    }

    const data = await res.json();
    const modelsList: ModelInfo[] = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [{ id: DEFAULT_MODEL, object: 'model' }]);
    return { success: true, models: modelsList };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to connect to Konsole API server.',
    };
  }
}
