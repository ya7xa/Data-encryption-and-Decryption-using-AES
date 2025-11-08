from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from Crypto.Cipher import AES
import binascii

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- helpers: PKCS7 padding ---
def pkcs7_pad(data: bytes, block_size: int = 16) -> bytes:
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len]) * pad_len


def pkcs7_unpad(data: bytes) -> bytes:
    if not data:
        raise ValueError("Empty input for unpad")
    pad_len = data[-1]
    if pad_len < 1 or pad_len > 16:
        raise ValueError("Invalid padding length")
    if data[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("Invalid padding bytes")
    return data[:-pad_len]


def bytes_to_hex(b: bytes) -> str:
    return binascii.hexlify(b).decode("utf-8")


def bytes_to_binary(b: bytes) -> str:
    return " ".join(format(x, "08b") for x in b)


# --- simple Pydantic model for API ---
class EncryptRequest(BaseModel):
    plaintext: str
    key_hex: str | None = None  # optional hex key input (32 hex chars for AES-128)


class DecryptRequest(BaseModel):
    ciphertext_hex: str
    key_hex: str | None = None  # optional hex key input (32 hex chars for AES-128)


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/encrypt")
async def api_encrypt(req: EncryptRequest):
    if not req.plaintext:
        raise HTTPException(status_code=400, detail="Missing plaintext")

    # Limit input size
    if len(req.plaintext) > 4096:
        raise HTTPException(status_code=413, detail="Input too large (max 4096 characters)")

    # Determine key: either user provided (hex) or use fixed demo key
    if req.key_hex:
        try:
            key = binascii.unhexlify(req.key_hex)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid hex key")
        if len(key) not in (16, 24, 32):
            raise HTTPException(status_code=400, detail="Key length must be 16, 24, or 32 bytes")
    else:
        key = b"DemoAESKey123456"  # demo 16-byte key (AES-128)

    # Convert to bytes
    plaintext_bytes = req.plaintext.encode("utf-8")

    # ASCII + binary
    ascii_vals = [ord(ch) for ch in req.plaintext]
    ascii_str = " ".join(str(v) for v in ascii_vals)
    binary_str = " ".join(format(v, "08b") for v in ascii_vals)

    # Encrypt
    padded = pkcs7_pad(plaintext_bytes, 16)
    cipher = AES.new(key, AES.MODE_ECB)
    ciphertext = cipher.encrypt(padded)

    response = {
        "original": req.plaintext,
        "ascii": ascii_vals,
        "ascii_str": ascii_str,
        "binary": binary_str,
        "cipher_hex": bytes_to_hex(ciphertext),
        "cipher_binary": bytes_to_binary(ciphertext),
        "padded_hex": bytes_to_hex(padded),
    }

    return JSONResponse(response)


@app.post("/api/decrypt")
async def api_decrypt(req: DecryptRequest):
    if not req.ciphertext_hex:
        raise HTTPException(status_code=400, detail="Missing ciphertext")

    # Limit input size
    if len(req.ciphertext_hex) > 8192:
        raise HTTPException(status_code=413, detail="Input too large (max 8192 hex characters)")

    # Determine key: either user provided (hex) or use fixed demo key
    if req.key_hex:
        try:
            key = binascii.unhexlify(req.key_hex)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid hex key")
        if len(key) not in (16, 24, 32):
            raise HTTPException(status_code=400, detail="Key length must be 16, 24, or 32 bytes")
    else:
        key = b"DemoAESKey123456"  # demo 16-byte key (AES-128)

    # Convert hex to bytes
    try:
        ciphertext = binascii.unhexlify(req.ciphertext_hex.replace(" ", "").replace("\n", ""))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid hex ciphertext")

    # Decrypt
    try:
        cipher = AES.new(key, AES.MODE_ECB)
        padded_plaintext = cipher.decrypt(ciphertext)
        plaintext_bytes = pkcs7_unpad(padded_plaintext)
        plaintext = plaintext_bytes.decode("utf-8")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Decryption failed: {str(e)}")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Decryption produced invalid UTF-8")

    # ASCII + binary
    ascii_vals = [ord(ch) for ch in plaintext]
    ascii_str = " ".join(str(v) for v in ascii_vals)
    binary_str = " ".join(format(v, "08b") for v in ascii_vals)

    response = {
        "decrypted": plaintext,
        "ascii": ascii_vals,
        "ascii_str": ascii_str,
        "binary": binary_str,
        "cipher_hex": req.ciphertext_hex.replace(" ", "").replace("\n", ""),
        "padded_hex": bytes_to_hex(padded_plaintext),
    }

    return JSONResponse(response)