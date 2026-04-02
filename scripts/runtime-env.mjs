import crypto from 'crypto';
import fs from 'fs';
import { spawn } from 'child_process';

const ENCRYPTION_KEY = 'dondhomilo_dondhomilo_dondhomilo';  // process.env.ENV_MASTER_KEY; // Pass this via your OS/Terminal
const IV_LENGTH = 16;

export function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    console.log(" DECRYPT "+ decrypted)
    return decrypted.toString();
}


// 2. Only run the "auto-boot" logic if this file is called directly via node
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('runtime-env.mjs')) {
    const ENCRYPTION_KEY = process.env.ENV_MASTER_KEY;

    try {
        const encryptedData = fs.readFileSync('.env.encrypted', 'utf8');
        const decryptedEnv = decrypt(encryptedData);

        // Parse string and inject into process.env
        decryptedEnv.split('\n').forEach(line => {
            const [key, ...value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.join('=').trim();
            }
        });

        console.log("🔓 Environment decrypted and injected.");

        // Run the Next.js command
        const cmd = process.argv[2] === 'build' ? 'next build' : 'next dev';
        spawn(cmd, { stdio: 'inherit', shell: true });

    } catch (error) {
        console.error("❌ Failed to decrypt environment:", error.message);
        process.exit(1);
    }
}