"""
Cryptographic Hashing & Integrity Verification Service
Uses standard Python hashlib.sha256
"""

import hashlib
import os

class HashService:
    @staticmethod
    def compute_sha256_from_file(file_path):
        """
        Calculates SHA-256 hash by reading the file in 64KB chunks
        to handle arbitrarily large files without loading them fully into memory.
        """
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            while chunk := f.read(65536):
                sha256.update(chunk)
        return sha256.hexdigest().lower()

    @staticmethod
    def compute_sha256_from_bytes(data_bytes):
        """Calculates SHA-256 hash from in-memory byte stream."""
        return hashlib.sha256(data_bytes).hexdigest().lower()

    @staticmethod
    def verify_hash(expected_hash, test_hash):
        """
        Constant-time or clean case-insensitive comparison of hashes.
        """
        if not expected_hash or not test_hash:
            return False
        return expected_hash.strip().lower() == test_hash.strip().lower()

    @staticmethod
    def format_size(size_bytes):
        """Converts raw byte count into human-readable size string (KB, MB, GB)."""
        if not size_bytes or size_bytes < 0:
            return "0 B"
        units = ['B', 'KB', 'MB', 'GB', 'TB']
        idx = 0
        val = float(size_bytes)
        while val >= 1024 and idx < len(units) - 1:
            val /= 1024
            idx += 1
        return f"{val:.1f} {units[idx]}"
