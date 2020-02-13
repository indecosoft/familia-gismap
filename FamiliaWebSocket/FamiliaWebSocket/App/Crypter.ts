import * as crypto from 'crypto';

import { config } from './config';

export function encript(text: any) {
    let iv = Buffer.from('FnJL7EDzjqWjcaY9');
    let cipher = crypto.createCipheriv('aes-128-cbc', config.cryptoKey, iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decript(text: any) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-128-cbc', config.cryptoKey, iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}
