"""Avvia BancaAdvisor con HTTPS per supporto PWA offline su iPhone."""
import os
import sys
import ssl

cert_dir = os.path.join(os.path.dirname(__file__), "certs")
cert_file = os.path.join(cert_dir, "server-cert.pem")
key_file = os.path.join(cert_dir, "server-key.pem")

if not os.path.isfile(cert_file):
    print("Certificati SSL non trovati. Generazione in corso...")
    from generate_certs import generate_certs
    generate_certs(cert_dir)

if __name__ == "__main__":
    import uvicorn
    
    # Verify SSL can load before starting
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(cert_file, key_file)
    print(f"SSL OK: {cert_file}")
    
    print("\n=== BancaAdvisor HTTPS ===")
    print(f"  https://localhost:8443")
    print()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8443,
        ssl_keyfile=key_file,
        ssl_certfile=cert_file,
        log_level="info",
    )
