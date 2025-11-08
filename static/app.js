// Tab switching
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // Update buttons
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update content
        tabContents.forEach(c => c.classList.remove('active'));
        document.getElementById(`${targetTab}-section`).classList.add('active');
    });
});

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Copy to clipboard functionality
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const targetId = btn.dataset.copy;
        const targetElement = document.getElementById(targetId);
        const text = targetElement.textContent.trim();
        
        if (!text) {
            showNotification('Nothing to copy', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            showNotification('Copied to clipboard!', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification('Copied to clipboard!', 'success');
        }
    });
});

// Encryption functionality
const input = document.getElementById('inputText');
const asciiView = document.getElementById('asciiView');
const binaryView = document.getElementById('binaryView');
const encryptBtn = document.getElementById('encryptBtn');
const clearEncryptBtn = document.getElementById('clearEncryptBtn');
const cipherHex = document.getElementById('cipherHex');
const cipherBin = document.getElementById('cipherBin');
const paddedHex = document.getElementById('paddedHex');
const keyInput = document.getElementById('keyHex');
const encryptCharCount = document.getElementById('encrypt-char-count');

function updateLiveViews() {
    const text = input.value || '';
    const charCount = text.length;
    encryptCharCount.textContent = `${charCount} character${charCount !== 1 ? 's' : ''}`;
    
    // ASCII
    const ascii = Array.from(text).map(ch => ch.charCodeAt(0));
    asciiView.textContent = ascii.length > 0 ? ascii.join(' ') : '—';
    
    // Binary
    const bin = ascii.map(n => n.toString(2).padStart(8, '0'));
    binaryView.textContent = bin.length > 0 ? bin.join(' ') : '—';
    
    // Auto-resize textarea
    input.style.height = 'auto';
    input.style.height = Math.min(400, Math.max(120, input.scrollHeight)) + 'px';
}

input.addEventListener('input', updateLiveViews);
window.addEventListener('load', updateLiveViews);

encryptBtn.addEventListener('click', async () => {
    const plaintext = input.value || '';
    const keyHex = keyInput.value.trim() || null;
    
    if (!plaintext) {
        showNotification('Please enter some text to encrypt', 'error');
        return;
    }
    
    encryptBtn.disabled = true;
    encryptBtn.innerHTML = '<span class="btn-icon">⏳</span><span>Encrypting...</span>';
    
    try {
        const res = await fetch('/api/encrypt', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({plaintext, key_hex: keyHex})
        });
        
        if (!res.ok) {
            const err = await res.json();
            showNotification(`Error: ${err.detail || JSON.stringify(err)}`, 'error');
            return;
        }
        
        const data = await res.json();
        
        // Format hex output (64 chars per line)
        cipherHex.textContent = data.cipher_hex.match(/.{1,64}/g)?.join('\n') || data.cipher_hex;
        
        // Format binary output (256 chars per line)
        cipherBin.textContent = data.cipher_binary.match(/.{1,256}/g)?.join('\n') || data.cipher_binary;
        
        // Format padded hex
        paddedHex.textContent = data.padded_hex.match(/.{1,64}/g)?.join('\n') || data.padded_hex;
        
        showNotification('Encryption successful!', 'success');
        
        // Scroll to output
        document.querySelector('.out-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
        showNotification(`Request failed: ${e.message}`, 'error');
    } finally {
        encryptBtn.disabled = false;
        encryptBtn.innerHTML = '<span class="btn-icon">🔒</span><span>Encrypt</span>';
    }
});

clearEncryptBtn.addEventListener('click', () => {
    input.value = '';
    keyInput.value = '';
    asciiView.textContent = '—';
    binaryView.textContent = '—';
    cipherHex.textContent = '';
    cipherBin.textContent = '';
    paddedHex.textContent = '';
    updateLiveViews();
});

// Decryption functionality
const decryptInput = document.getElementById('decryptInput');
const decryptBtn = document.getElementById('decryptBtn');
const clearDecryptBtn = document.getElementById('clearDecryptBtn');
const decryptKeyHex = document.getElementById('decryptKeyHex');
const decryptedText = document.getElementById('decryptedText');
const decryptAscii = document.getElementById('decryptAscii');
const decryptBinary = document.getElementById('decryptBinary');
const decryptPaddedHex = document.getElementById('decryptPaddedHex');
const decryptCharCount = document.getElementById('decrypt-char-count');

decryptInput.addEventListener('input', () => {
    const text = decryptInput.value.replace(/\s/g, '');
    const charCount = text.length;
    decryptCharCount.textContent = `${charCount} character${charCount !== 1 ? 's' : ''}`;
    
    // Auto-resize textarea
    decryptInput.style.height = 'auto';
    decryptInput.style.height = Math.min(400, Math.max(120, decryptInput.scrollHeight)) + 'px';
});

decryptBtn.addEventListener('click', async () => {
    const ciphertextHex = decryptInput.value.trim() || '';
    const keyHex = decryptKeyHex.value.trim() || null;
    
    if (!ciphertextHex) {
        showNotification('Please enter ciphertext to decrypt', 'error');
        return;
    }
    
    // Basic validation - hex should only contain 0-9, a-f, A-F and whitespace
    const cleanHex = ciphertextHex.replace(/\s/g, '');
    if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
        showNotification('Invalid hex format. Only 0-9, a-f, A-F allowed', 'error');
        return;
    }
    
    if (cleanHex.length % 2 !== 0) {
        showNotification('Hex string must have even length', 'error');
        return;
    }
    
    decryptBtn.disabled = true;
    decryptBtn.innerHTML = '<span class="btn-icon">⏳</span><span>Decrypting...</span>';
    
    try {
        const res = await fetch('/api/decrypt', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ciphertext_hex: ciphertextHex, key_hex: keyHex})
        });
        
        if (!res.ok) {
            const err = await res.json();
            showNotification(`Error: ${err.detail || JSON.stringify(err)}`, 'error');
            return;
        }
        
        const data = await res.json();
        
        // Display decrypted text
        decryptedText.textContent = data.decrypted || '—';
        
        // Display ASCII
        decryptAscii.textContent = data.ascii_str || '—';
        
        // Display binary
        decryptBinary.textContent = data.binary || '—';
        
        // Display padded hex
        decryptPaddedHex.textContent = data.padded_hex.match(/.{1,64}/g)?.join('\n') || data.padded_hex;
        
        showNotification('Decryption successful!', 'success');
        
        // Scroll to output
        document.querySelector('#decrypt-section .out-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
        showNotification(`Request failed: ${e.message}`, 'error');
    } finally {
        decryptBtn.disabled = false;
        decryptBtn.innerHTML = '<span class="btn-icon">🔓</span><span>Decrypt</span>';
    }
});

clearDecryptBtn.addEventListener('click', () => {
    decryptInput.value = '';
    decryptKeyHex.value = '';
    decryptedText.textContent = '';
    decryptAscii.textContent = '';
    decryptBinary.textContent = '';
    decryptPaddedHex.textContent = '';
    decryptInput.dispatchEvent(new Event('input'));
});

// Quick copy from encrypt to decrypt
cipherHex.addEventListener('dblclick', () => {
    const hexText = cipherHex.textContent.replace(/\s/g, '');
    if (hexText) {
        // Switch to decrypt tab
        document.querySelector('[data-tab="decrypt"]').click();
        // Set the ciphertext
        setTimeout(() => {
            decryptInput.value = hexText;
            decryptInput.dispatchEvent(new Event('input'));
            showNotification('Ciphertext copied to decrypt tab', 'success');
        }, 100);
    }
});
