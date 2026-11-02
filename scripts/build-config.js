/* ==========================================================================
   환경변수 → assets/js/config.js 생성
   - 로컬: 프로젝트 루트의 .env 를 읽음        →  node scripts/build-config.js
   - 배포: GitHub Actions 가 Secrets/Variables 를 환경변수로 넘겨 실행
   ※ config.js 는 브라우저에 그대로 노출된다. 공개돼도 되는 값만 PUBLIC_KEYS 에 넣을 것.
     (Web3Forms access key, Supabase anon key 는 공개용 키라 괜찮음. 서비스 키·비밀번호는 절대 금지)
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_KEYS = ['WEB3FORMS_ACCESS_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];

function readDotEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );
}

const env = { ...readDotEnv(path.join(ROOT, '.env')), ...process.env };
const config = Object.fromEntries(PUBLIC_KEYS.map((k) => [k, env[k] || '']));

const out = path.join(ROOT, 'assets/js/config.js');
fs.writeFileSync(out, `/* 자동 생성 파일 — 직접 수정하지 말 것 (scripts/build-config.js) */\nwindow.SITE_CONFIG = ${JSON.stringify(config, null, 2)};\n`);

const missing = PUBLIC_KEYS.filter((k) => !config[k]);
console.log(`config.js 생성 완료${missing.length ? ` (비어 있는 값: ${missing.join(', ')})` : ''}`);
