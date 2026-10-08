# Elyano Agent

Elyano Agent is a standalone, cloud-AI-backed workplace assistant created by Mustafa Elyan. It runs separately from Elyano Connect on port `6050`; it does not run a local model or require Ollama.

## First-time setup

1. Install Node.js 20 or newer and the document converters on the VM.
2. Copy `.env.example` to `.env`, then set `AGENT_CERT_HOST=10.11.0.190`. Configure AI keys, LDAP, and Elyano Connect login in **Admin & learning → Services & AI**.
3. Install and build:

   ```sh
   npm install
   npm run build
   ```

4. Start the service with `npm start`. It listens on `https://0.0.0.0:6050` by default and creates a self-signed certificate in `certs/` on first start. The certificate private key is owner-readable only. Set `AGENT_CERT_HOST` to `10.11.0.190` or the DNS name users will browse to, then restart to regenerate the certificate if it has not yet been created.
5. Browse to `https://10.11.0.190:6050`. On first use, create the local administrator with a unique password of at least 12 characters. For unattended provisioning, set `BOOTSTRAP_ADMIN_PASSWORD` before the first start and remove it immediately after the account is created.

Before the online/chat integration works, rebuild and deploy Elyano Connect from the parent project source, then restart Connect:

```powershell
Set-Location "C:\path\to\New folder (6)"
npm run build
```

In Connect's admin panel, create or confirm a **local, non-admin** user named `Agent`. In Elyano Agent, open **Admin & learning → Services & AI**, enter the Agent account password, save the Connect certificate PEM, and save the service settings. The status in that panel should change to **online**. Configure LDAP and the approved AI provider keys in the same panel. These service credentials are encrypted in Agent's private data directory and do not need to be placed in `.env`.

For systemd deployment, install the project at `/opt/elyano-agent`, create the `elyano-agent` service account, protect `.env` with mode `0600`, build the client, then install and enable `elyano-agent.service`:

```sh
sudo install -m 0644 elyano-agent.service /etc/systemd/system/elyano-agent.service
sudo systemctl daemon-reload
sudo systemctl enable --now elyano-agent
sudo systemctl status elyano-agent
```

Adjust `ExecStart`, `WorkingDirectory`, `EnvironmentFile`, and writable paths in the unit if the Node binary or installation path differs on the VM.

For a trusted browser experience, install a certificate issued by the hospital's internal CA in `certs/agent-cert.pem` and its matching private key in `certs/agent-key.pem`, or replace the generated files with the approved pair. Never expose the key file through a web server or source control.

For the Connect integration, the server-to-server client does not inherit a browser's certificate-warning exception. In Connect's working directory, provide only its public `cert.pem` contents in **Elyano Agent → Admin & learning → Services & AI → Elyano Connect TLS certificate**. Do not provide `key.pem`. Use a Connect URL whose hostname matches the certificate; for a same-VM certificate issued to `localhost`, use `https://localhost:3000`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `PORT`, `HOST` | Listener settings; defaults are `6050` and `0.0.0.0`. |
| `AGENT_CERT_HOST` | DNS name or IP included in the generated TLS certificate SAN. |
| `LIBREOFFICE_PATH`, `GHOSTSCRIPT_PATH` | Converter executable names or full paths. LibreOffice handles supported office conversions; Ghostscript compresses PDFs. |
| `MAX_UPLOAD_MB` | Maximum uploaded input size (1–100 MB; default 40 MB). |

AI keys, LDAP certificates, the Connect Agent password, the Connect TLS certificate, and SQL credentials are entered in the admin UI and encrypted with AES-256-GCM in `data/settings.json`. For LDAP trust errors, provide the issuing root or intermediate CA certificate in PEM format (not a private key), save settings, and retry the LDAP test. Alternatively, install the CA in the VM trust store and launch Node.js with `--use-system-ca`. StartTLS is enabled by default; disabling it for `ldap://` matches Elyano Connect's existing transport but sends passwords unencrypted, so only do this on a trusted network. Anonymous LDAP binds cannot authenticate a user's password. The encryption key is stored separately in `data/agent-secret.key`. Keep both files, `.env`, `data/`, and `certs/` private to the service account.

To store administrator-approved learning in SQL Server, open **Admin & learning → Services & AI → SQL Server learning storage**. The Agent defaults to its own database, `ElyanoAgentDB`, separate from Elyano Connect. **Test SQL Server** creates that database if missing, then creates `dbo.ElyanoAgentKnowledge` and migrates older local learning entries. The configured SQL identity needs permission to create a database and read/write its Agent database. Windows Authentication is the default: the Agent uses the Windows identity of its process/service. Install Microsoft ODBC Driver 17 or 18 on Windows. Alternatively select SQL Server Authentication and enter a SQL login. Saving or deleting learning is not reported as successful unless the SQL operation completes. SQL credentials are encrypted in Agent settings; they do not belong in `.env`.

To monitor internal network devices, add their private IPv4 addresses in **Admin & learning → Services & AI → Proactive IP monitoring**. The Agent pings each configured address once per minute and opens one ticket in the Connect IT Support group when a device stops responding. It retries a failed ticket report every five minutes and rearms alerts after the IP responds again. Targets are limited to RFC1918 private networks and to 30 addresses.

On Linux, the service creates the data and certificate directories with mode `0700`, and the private key with mode `0600`. On Windows, filesystem ACLs are inherited from the service account's certificate directory; restrict that directory to the service account and administrators before production use.

On Windows, restrict Agent data and certificate ACLs to the service account and administrators (run in elevated PowerShell and adjust the account name):

```powershell
icacls .\data /inheritance:r /grant:r "elyano-agent:(OI)(CI)F" "Administrators:(OI)(CI)F"
icacls .\certs /inheritance:r /grant:r "elyano-agent:(OI)(CI)F" "Administrators:(OI)(CI)F"
```

## Features

- Local administrator setup, administrator-created local accounts, and LDAP/AD authentication over StartTLS, LDAPS, or an explicit legacy plain-LDAP compatibility setting. Default LDAP is `ldap://elitehospital.org:389`; user authentication tries UPN then `DOMAIN\username`, matching Elyano Connect's password-bind flow.
- HttpOnly, SameSite session cookies; local passwords use salted scrypt hashes.
- Gemini and DeepSeek through their server-side APIs; admins enter keys in the settings UI and keys are never returned to the browser. Admin-configurable failover can retry chat, document, and Excel requests through the other configured provider; this may use that provider's quota or incur its charges.
- An admin-only teaching chat; administrators explicitly approve answers before they become SQL Server learning used as assistant context. SQL configuration and connectivity are required for new learning saves.
- Excel (`.xlsx`) and Word (`.docx`) document generation from typed instructions or uploaded `.txt`/`.md` guidance.
- AI-assisted Excel cleanup on an uploaded `.xlsx` copy: trim text, remove blank/duplicate rows, fill blanks, normalize case, or rename headers. Only the first worksheet is changed; other sheets are preserved. Only that worksheet's headers and structure are sent to the configured AI provider; cell values remain on the Agent server, and only allowlisted operations are applied.
- Office/PDF conversion through LibreOffice and PDF compression through Ghostscript. Actual formats depend on the installed converter; the UI reports missing tools instead of pretending a conversion succeeded.
- Persistent sign-in to Elyano Connect as the dedicated `Agent` account, so it appears online; the Agent can answer direct messages using the configured AI provider.
- Voice answering for direct Elyano Connect calls using the configurable Gemini Live model (default `gemini-2.5-flash-native-audio-preview-12-2025`); call audio is streamed for live speech processing and is not recorded by the Agent. Video calls are answered audio-only; video is not received or sent to Gemini.
- Directory lookup and relevant IT-helpdesk knowledge from Elyano Connect, using the active Agent sign-in and returning only the best matches.
- Limited context about on-duty IT support staff (department, Connect online status, extension, and expected shift end); technical problem reports are sent to Connect's ticket-enabled IT Support group and confirmed with the created ticket number.
- Arabic and Egyptian colloquial technical issue recognition, same-language troubleshooting guidance, directory-query detection, and voice-call instructions.
- Administrator-configured private-IP monitoring with deduplicated outage tickets.
- Animated Elyano splash screen and responsive desktop/mobile layout.

The app signs in only to the configured Elyano Connect Agent account; it does not automate logins to arbitrary consumer chat websites or claim every format is convertible. It uses official, configured provider APIs and converters installed on the VM.

## Local development

Copy `.env.example` to `.env`, set `USE_HTTPS=false`, and run `npm run dev`. Vite serves the preview on port 5173 and proxies API requests to the service on port 6050. Do not use the development HTTP setting for network deployment.

Run focused checks with:

```sh
npm test
npm run build
```

## Privacy and deployment

AI requests are sent to the configured provider. For Agent calls, live call audio is sent to Google Gemini Live using the Gemini key; video is not processed. Inform users before enabling or using the calling feature, and do not share passwords, patient-identifying information, or other sensitive information during calls unless the organization has explicitly approved that data flow. Uploaded source files are held in memory, conversion work files are removed after each request, and generated downloads expire after 30 minutes.

Expose port `6050` only on the required internal network, and allow inbound UDP ports `46000–46100` from the hospital network plus outbound STUN traffic for WebRTC calls. Run the service as a dedicated non-administrator account and back up `data/` securely. This source package does not install a Windows/Linux service, firewall rule, or production CA certificate automatically.
