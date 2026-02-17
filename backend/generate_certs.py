"""
Genera certificati SSL per BancaAdvisor (accesso HTTPS da rete locale).
Crea una CA locale + certificato server per tutti gli IP della rete locale.
"""
import os
import sys
import socket
import datetime
from pathlib import Path

from cryptography import x509
from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import ipaddress


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "192.168.1.1"


def generate_certs(cert_dir: str = None):
    if cert_dir is None:
        cert_dir = os.path.join(os.path.dirname(__file__), "certs")
    
    os.makedirs(cert_dir, exist_ok=True)
    
    ca_key_path = os.path.join(cert_dir, "ca-key.pem")
    ca_cert_path = os.path.join(cert_dir, "ca.pem")
    server_key_path = os.path.join(cert_dir, "server-key.pem")
    server_cert_path = os.path.join(cert_dir, "server-cert.pem")
    
    local_ip = get_local_ip()
    print(f"  IP locale rilevato: {local_ip}")
    
    # === 1. Genera CA (Certificate Authority) ===
    print("  Generazione CA...")
    ca_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    
    ca_name = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "BancaAdvisor Local CA"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "BancaAdvisor"),
    ])
    
    ca_cert = (
        x509.CertificateBuilder()
        .subject_name(ca_name)
        .issuer_name(ca_name)
        .public_key(ca_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3650))
        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
        .add_extension(x509.KeyUsage(
            digital_signature=True, key_cert_sign=True, crl_sign=True,
            content_commitment=False, key_encipherment=False,
            data_encipherment=False, key_agreement=False,
            encipher_only=False, decipher_only=False,
        ), critical=True)
        .sign(ca_key, hashes.SHA256())
    )
    
    with open(ca_key_path, "wb") as f:
        f.write(ca_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.TraditionalOpenSSL,
            serialization.NoEncryption(),
        ))
    
    with open(ca_cert_path, "wb") as f:
        f.write(ca_cert.public_bytes(serialization.Encoding.PEM))
    
    # === 2. Genera certificato server ===
    print("  Generazione certificato server...")
    server_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    
    server_name = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "BancaAdvisor Server"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "BancaAdvisor"),
    ])
    
    # SAN: tutti gli IP/hostname possibili
    san_entries = [
        x509.DNSName("localhost"),
        x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
        x509.IPAddress(ipaddress.IPv4Address(local_ip)),
    ]
    
    # Aggiungi anche il range 192.168.1.x comune
    ip_base = ".".join(local_ip.split(".")[:3])
    for i in range(1, 255):
        try:
            san_entries.append(x509.IPAddress(ipaddress.IPv4Address(f"{ip_base}.{i}")))
        except Exception:
            pass
    
    server_cert = (
        x509.CertificateBuilder()
        .subject_name(server_name)
        .issuer_name(ca_name)
        .public_key(server_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=825))
        .add_extension(x509.SubjectAlternativeName(san_entries), critical=False)
        .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.SERVER_AUTH]), critical=False)
        .sign(ca_key, hashes.SHA256())
    )
    
    with open(server_key_path, "wb") as f:
        f.write(server_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.TraditionalOpenSSL,
            serialization.NoEncryption(),
        ))
    
    with open(server_cert_path, "wb") as f:
        f.write(server_cert.public_bytes(serialization.Encoding.PEM))
    
    print(f"\n  Certificati creati in: {cert_dir}")
    print(f"  CA cert:     {ca_cert_path}")
    print(f"  Server cert: {server_cert_path}")
    print(f"  Server key:  {server_key_path}")
    
    return {
        "ca_cert": ca_cert_path,
        "server_cert": server_cert_path,
        "server_key": server_key_path,
        "local_ip": local_ip,
    }


if __name__ == "__main__":
    print("\n=== BancaAdvisor — Generazione Certificati SSL ===\n")
    info = generate_certs()
    print(f"""
=== ISTRUZIONI PER iPHONE ===

1. Avvia il server con: start.bat
2. Dal iPhone, apri Safari e vai a:
   https://{info['local_ip']}:8000/ca.pem

3. iOS ti chiederà di installare il profilo.
   Vai in: Impostazioni → Generali → VPN e gestione dispositivi
   → Installa il profilo "BancaAdvisor Local CA"

4. Poi vai in: Impostazioni → Generali → Info
   → Attendibilità certificati → attiva "BancaAdvisor Local CA"

5. Ora torna su Safari e vai a:
   https://{info['local_ip']}:8000
   
   Naviga nell'app, poi salvala come segnalibro o aggiungila 
   alla schermata Home. Funzionerà anche offline!
""")
