import 'server-only';

type RuntimeKonsoleConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  configuredAt?: number;
};

const runtime: RuntimeKonsoleConfig = {};

export function getRuntimeKonsoleConfig() {
  return {
    apiKey: runtime.apiKey || process.env.KONSOLE_API_KEY,
    baseUrl: runtime.baseUrl || process.env.KONSOLE_BASE_URL || 'https://api.konsole.one/v1',
    model: runtime.model || process.env.KONSOLE_MODEL_ID || '',
    runtime: Boolean(runtime.apiKey),
    configuredAt: runtime.configuredAt,
  };
}

export function setRuntimeKonsoleCredential(apiKey: string, baseUrl: string, model?: string) {
  runtime.apiKey = apiKey;
  runtime.baseUrl = baseUrl.replace(/\/+$/, '');
  if (model) runtime.model = model;
  runtime.configuredAt = Date.now();
}

export function setRuntimeKonsoleModel(model: string) {
  runtime.model = model;
  runtime.configuredAt = Date.now();
}
