import fs from 'node:fs';
import path from 'node:path';

type RuntimeKonsoleConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  configuredAt?: number;
};

const runtime: RuntimeKonsoleConfig = {};

function sanitizeModel(model?: string): string {
  if (!model || /^[a-f0-9]{32,64}$/i.test(model.trim())) {
    return 'gemini-2.5-flash';
  }
  return model.trim();
}

function updateEnvFile(apiKey?: string, baseUrl?: string, model?: string) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    if (baseUrl) {
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      content = content.includes('KONSOLE_BASE_URL=')
        ? content.replace(/KONSOLE_BASE_URL=.*/g, `KONSOLE_BASE_URL=${cleanUrl}`)
        : `${content}\nKONSOLE_BASE_URL=${cleanUrl}`;
      process.env.KONSOLE_BASE_URL = cleanUrl;
    }
    if (model) {
      const sanitized = sanitizeModel(model);
      content = content.includes('KONSOLE_MODEL_ID=')
        ? content.replace(/KONSOLE_MODEL_ID=.*/g, `KONSOLE_MODEL_ID=${sanitized}`)
        : `${content}\nKONSOLE_MODEL_ID=${sanitized}`;
      process.env.KONSOLE_MODEL_ID = sanitized;
    }
    if (apiKey) {
      content = content.includes('KONSOLE_API_KEY=')
        ? content.replace(/KONSOLE_API_KEY=.*/g, `KONSOLE_API_KEY=${apiKey}`)
        : `${content}\nKONSOLE_API_KEY=${apiKey}`;
      process.env.KONSOLE_API_KEY = apiKey;
    }
    fs.writeFileSync(envPath, content.trim() + '\n', 'utf8');
  } catch {}
}

export function getRuntimeKonsoleConfig() {
  return {
    apiKey: runtime.apiKey || process.env.KONSOLE_API_KEY,
    baseUrl: runtime.baseUrl || process.env.KONSOLE_BASE_URL || 'https://api.konsole.one/v1',
    model: sanitizeModel(runtime.model || process.env.KONSOLE_MODEL_ID),
    runtime: Boolean(runtime.apiKey || process.env.KONSOLE_API_KEY),
    configuredAt: runtime.configuredAt,
  };
}

export function setRuntimeKonsoleCredential(apiKey: string, baseUrl: string, model?: string) {
  runtime.apiKey = apiKey;
  runtime.baseUrl = baseUrl.replace(/\/+$/, '');
  if (model) runtime.model = sanitizeModel(model);
  runtime.configuredAt = Date.now();

  updateEnvFile(apiKey, baseUrl, model);
}

export function setRuntimeKonsoleModel(model: string) {
  runtime.model = sanitizeModel(model);
  runtime.configuredAt = Date.now();

  updateEnvFile(undefined, undefined, model);
}
