# 🔐 Enabling HTTPS with Let’s Encrypt (Certbot + Apache)

## 1 Install Certbot (Apache plugin)

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-apache
```

If you use UFW, make sure HTTPS is allowed:
```bash
sudo ufw allow "Apache Full"
```

---

## 2 Obtain and auto-configure SSL certificates

Certbot will scan your existing Apache virtual hosts, issue certificates, and create corresponding `:443` HTTPS vhosts automatically.

```bash
sudo certbot --apache -d iotrack.live -d www.iotrack.live
```

> 💡 Include both domains so the certificate covers:
> - `https://iotrack.live`
> - `https://www.iotrack.live`

When prompted, choose **“Redirect HTTP to HTTPS”** so all traffic is secured automatically.

---

## 3 Ensure required Apache modules are enabled

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers ssl
sudo apachectl -t && sudo systemctl reload apache2
```

---

## 4 Test certificate renewal

Certbot automatically installs a **systemd timer** that renews certificates every 60–90 days.  
You can simulate and verify renewal safely with:

```bash
sudo certbot renew --dry-run
```

---

## 5 Confirm the auto-renewal timer

Check that the renewal service is active and scheduled:

```bash
systemctl status certbot.timer   # should be active (waiting)
```

To see when it will next run:
```bash
systemctl list-timers | grep certbot
```

---

## 6 Optional: Reload Apache automatically after renewal

To ensure Apache always loads the new certificates, create a small hook:

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
echo '#!/bin/sh
apachectl -t && systemctl reload apache2
' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-apache.sh >/dev/null
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-apache.sh
```

---

## 🧩 Apache HTTO and HTTPS vhost (with WebSocket proxy)

iotrack.live.conf:
```apache
<VirtualHost *:80>
  ServerName iotrack.live
  ServerAlias www.iotrack.live

  ProxyPreserveHost On
  ProxyRequests Off

  # --- 1) Upgrade /socket.io/* to WebSocket when requested ---
  RewriteEngine On
  # some clients send "Connection: keep-alive, Upgrade"
  RewriteCond %{HTTP:Upgrade} =websocket [NC]
  RewriteCond %{HTTP:Connection} upgrade [NC]
  RewriteCond %{REQUEST_URI} ^/socket.io/ [NC]
  RewriteRule ^/socket.io/(.*)$  ws://127.0.0.1:4003/socket.io/$1  [P,L]

  # --- 2) Fallback to HTTP polling for /socket.io/* ---
  ProxyPass        "/socket.io/"  "http://127.0.0.1:4003/socket.io/"
  ProxyPassReverse "/socket.io/"  "http://127.0.0.1:4003/socket.io/"

  # --- 3) Main web app/API on 4001 ---
  ProxyPass        "/api/"  "http://127.0.0.1:4001/api/"
  ProxyPassReverse "/api/"  "http://127.0.0.1:4001/api/"

  # --- 3) Main web app/APP on 4002 ---
  ProxyPass        "/img/"  "http://127.0.0.1:4002/img/"
  ProxyPassReverse "/img/"  "http://127.0.0.1:4002/img/"

  # --- 3) Main web app/APP on 4000 ---
  ProxyPass        "/"  "http://127.0.0.1:4000/"
  ProxyPassReverse "/"  "http://127.0.0.1:4000/"

  ErrorLog  ${APACHE_LOG_DIR}/iotrack.live-error.log
  CustomLog ${APACHE_LOG_DIR}/iotrack.live-access.log combined
RewriteCond %{SERVER_NAME} =www.iotrack.live [OR]
RewriteCond %{SERVER_NAME} =iotrack.live
RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
```

iotrack.live-le-ssl.conf:
``` apache
<IfModule mod_ssl.c>
<VirtualHost *:443>
  ServerName iotrack.live
  ServerAlias www.iotrack.live

  ProxyPreserveHost On
  ProxyRequests Off

  # --- 1) Upgrade /socket.io/* to WebSocket when requested ---
  RewriteEngine On
  # some clients send "Connection: keep-alive, Upgrade"
  RewriteCond %{HTTP:Upgrade} =websocket [NC]
  RewriteCond %{HTTP:Connection} upgrade [NC]
  RewriteCond %{REQUEST_URI} ^/socket.io/ [NC]
  RewriteRule ^/socket.io/(.*)$  ws://127.0.0.1:4003/socket.io/$1  [P,L]

  # --- 2) Fallback to HTTP polling for /socket.io/* ---
  ProxyPass        "/socket.io/"  "http://127.0.0.1:4003/socket.io/"
  ProxyPassReverse "/socket.io/"  "http://127.0.0.1:4003/socket.io/"

  # --- 3) Main web app/API on 4001 ---
  ProxyPass        "/api/"  "http://127.0.0.1:4001/api/"
  ProxyPassReverse "/api/"  "http://127.0.0.1:4001/api/"

  # --- 3) Main web app/APP on 4002 ---
  ProxyPass        "/img/"  "http://127.0.0.1:4002/img/"
  ProxyPassReverse "/img/"  "http://127.0.0.1:4002/img/"

  # --- 3) Main web app/APP on 4000 ---
  ProxyPass        "/"  "http://127.0.0.1:4000/"
  ProxyPassReverse "/"  "http://127.0.0.1:4000/"

  ErrorLog  ${APACHE_LOG_DIR}/iotrack.live-error.log
  CustomLog ${APACHE_LOG_DIR}/iotrack.live-access.log combined


Include /etc/letsencrypt/options-ssl-apache.conf
SSLCertificateFile /etc/letsencrypt/live/iotrack.live/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/iotrack.live/privkey.pem
</VirtualHost>
</IfModule>

```

---

## 🧠 Notes

- Certificates are stored in `/etc/letsencrypt/live/<domain>/`
- Renewal happens automatically — no manual steps are needed.
- You can check HTTPS connectivity with:
  ```bash
  curl -I https://iotrack.live
  ```
- Test WebSocket connection (optional):
  ```bash
  wscat -c "wss://iotrack.live/socket.io/?EIO=4&transport=websocket"
  ```
