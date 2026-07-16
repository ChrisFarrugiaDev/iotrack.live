#!/usr/bin/env python3
"""Mint an HS256 JWT shaped like the Node backend's UserJWT, for dev testing.

The secret is read from computation.server.go/.env.development by default,
so tokens verify against a server started by devserver.sh. Prints the token
to stdout and nothing else, so it can be captured directly:

    TOKEN=$(mktoken.py --role 2)
    TOKEN=$(mktoken.py --role 1 --user 7 --org 3)
"""

import argparse
import base64
import hashlib
import hmac
import json
import pathlib
import sys
import time

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
DEFAULT_ENV_FILE = REPO_ROOT / "computation.server.go" / ".env.development"


def read_secret(env_file: pathlib.Path) -> str:
    for line in env_file.read_text().splitlines():
        if line.startswith("JWT_SECRET"):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"JWT_SECRET not found in {env_file}")


def b64(data: bytes) -> bytes:
    return base64.urlsafe_b64encode(data).rstrip(b"=")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--role", required=True, help="role_id claim (1=sys_admin, 2=admin, 3=user, 4=viewer)")
    p.add_argument("--user", default="999999", help="id claim (default 999999)")
    p.add_argument("--org", default="1", help="org_id claim (default 1)")
    p.add_argument("--hours", type=float, default=1.0, help="expiry from now (default 1h; negative = expired)")
    p.add_argument("--env-file", type=pathlib.Path, default=DEFAULT_ENV_FILE, help="env file holding JWT_SECRET")
    args = p.parse_args()

    secret = read_secret(args.env_file)

    header = b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = b64(json.dumps({
        "sub": "dev-test",
        "id": str(args.user),
        "email": "dev-test@example.com",
        "role_id": str(args.role),
        "org_id": str(args.org),
        "exp": int(time.time() + args.hours * 3600),
    }).encode())

    signature = b64(hmac.new(secret.encode(), header + b"." + payload, hashlib.sha256).digest())
    print((header + b"." + payload + b"." + signature).decode())


if __name__ == "__main__":
    main()
