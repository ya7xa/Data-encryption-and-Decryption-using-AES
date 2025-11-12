🔐 Data Encryption and Decryption using AES
📘 Overview

Advanced Encryption Standard (AES) is a symmetric block cipher that operates on fixed-size blocks of data (128 bits) and supports key sizes of 128, 192, or 256 bits.
It is one of the most secure and efficient encryption standards in use today.

🔹 Key Features

Operates on 128-bit data blocks

Supports 128 / 192 / 256-bit keys

Performs 10 / 12 / 14 rounds of encryption based on key size

Provides stronger security and better performance than Triple-DES

Does not use the Feistel structure

Widely used in email, Wi-Fi, HTTPS, mobile apps, file storage, and VPNs

Approved by the NSA for protecting classified data up to TOP SECRET (with 192- or 256-bit keys)

⚙️ AES Encryption Process

AES organizes both the plaintext and the encryption key into 4×4 matrices of 8-bit elements.

If the message is represented as:
m = m₀ | m₁ | ... | m₁₅
then the initial state matrix is filled column-wise.

🔑 1. Key Generation

A secret key (128, 192, or 256 bits) is generated.

The key must remain private — anyone with the key can decrypt the data.

🧩 2. SubBytes (Substitution)

Each byte is replaced using an S-box (substitution table).

This introduces confusion and hides data patterns.

🔄 3. ShiftRows (Permutation)

Rows of the matrix are shifted by different offsets.

This increases diffusion by spreading data influence.

➗ 4. MixColumns

Columns are mixed using mathematical operations in a finite field.

This step enhances diffusion even further.

⚡ 5. AddRoundKey

Each byte is XORed with a portion of the secret key.

This ties encryption strength directly to the key.

🔁 6. Rounds

The above operations repeat for several rounds:

10 rounds for AES-128

12 rounds for AES-192

14 rounds for AES-256

More rounds = stronger security.

🧱 7. Ciphertext Output

After the final round, the ciphertext (encrypted data) is produced.
Decryption reverses this process using the same key.

🎓 Educational AES Implementation (ECB Mode)

This project demonstrates AES encryption and decryption using the ECB (Electronic Codebook) mode — designed purely for educational purposes.

🔧 How It Works

AES uses a single symmetric key for both encryption and decryption.

In ECB mode, plaintext is divided into 16-byte blocks, and each block is encrypted independently with the same key.
<img width="778" height="997" alt="image" src="https://github.com/user-attachments/assets/64e55dd1-e4e6-42f1-b5f1-d6dda171d434" />


⚠️ Important:
ECB mode is not secure for real-world applications.
Identical plaintext blocks produce identical ciphertext blocks, which can reveal data patterns.
For secure implementations, use CBC, CFB, or GCM modes instead
