📸 Snapshot del proyecto — NautaWeb + Extensión Chrome

✅ Completado (23/37 archivos)
#ArchivoEstado1nauta-web/package.json✅2nauta-web/next.config.ts✅3nauta-web/tailwind.config.ts✅4nauta-web/tsconfig.json✅—.gitignore✅5src/app/globals.css✅6src/app/layout.tsx✅7src/app/page.tsx✅8api/nauta/init/route.ts✅9api/nauta/login/route.ts✅10api/nauta/logout/route.ts✅11api/nauta/remaining/route.ts✅12api/nauta/captcha/route.ts✅13api/nauta/portal-login/route.ts✅14api/nauta/account/route.ts✅15api/nauta/recharge/route.ts✅16api/nauta/transfer/route.ts✅17api/nauta/password/route.ts✅18api/nauta/history/route.ts✅19src/lib/nauta-client.ts✅20src/hooks/useNauta.ts✅21src/components/LoginPanel.tsx✅22src/components/Dashboard.tsx✅

🔄 Pendiente — Next.js (6 archivos)
#ArchivoDescripción23components/SessionCard.tsxMuestra info de la sesión activa: wlanuserip, sesiones recientes24components/AccountCard.tsxDatos del portal: saldo, fecha vencimiento, correo asociado25components/RechargeModal.tsxModal con input del código de recarga26components/TransferModal.tsxModal: cuenta destino + monto27components/PasswordModal.tsxModal: tipo (cuenta/email) + contraseñas28components/HistoryTable.tsxTabla paginada: conexiones / recargas / transferencias

🔄 Pendiente — Extensión Chrome MV3 (9 archivos)
#ArchivoDescripción29manifest.jsonConfig MV3: permisos, host_permissions para Nauta30src/nauta-client.jsPort JS del cliente Nauta (sin Node, puro browser con host_permissions para CORS)31src/background/service-worker.jsService worker MV3: maneja estado global de sesión32src/popup/popup.htmlHTML del popup de la extensión33src/popup/popup.cssEstilos del popup (mismo look que la web app)34src/popup/popup.jsLógica del popup: login, tiempo, acciones35src/options/options.htmlPágina de opciones de la extensión36src/options/options.jsLógica de opciones37icons/icon.svgÍcono de la extensión

🏗️ Arquitectura general
USUARIO
  │
  ├─► nauta-web (Next.js)
  │     React UI → /api/nauta/* (server-side) → ETECSA Nauta
  │     Sin CORS porque todo pasa por el servidor Node.js
  │
  └─► nauta-extension (Chrome MV3)
        Popup JS → background service worker → ETECSA Nauta
        Sin CORS porque la extensión tiene host_permissions
Diferencia clave entre ambos:

La app web usa un servidor Next.js como proxy para evitar CORS
La extensión habla directamente con Nauta desde el browser gracias a host_permissions en el manifest


🚀 Cómo ejecutar cuando esté todo listo
Next.js:
bashcd nauta-web
npm install
npm run dev
# → http://localhost:3000
Extensión Chrome:
1. Ir a chrome://extensions/
2. Activar "Modo desarrollador"
3. "Cargar descomprimida" → seleccionar carpeta nauta-extension/



📸 Snapshot actualizado
✅ Completado (25/37)
nauta-web/
├── ✅ package.json
├── ✅ next.config.ts
├── ✅ tailwind.config.ts
├── ✅ tsconfig.json
├── ✅ .gitignore
└── src/
    ├── app/
    │   ├── ✅ globals.css
    │   ├── ✅ layout.tsx
    │   ├── ✅ page.tsx
    │   └── api/nauta/
    │       ├── ✅ init/route.ts
    │       ├── ✅ login/route.ts
    │       ├── ✅ logout/route.ts
    │       ├── ✅ remaining/route.ts
    │       ├── ✅ captcha/route.ts
    │       ├── ✅ portal-login/route.ts
    │       ├── ✅ account/route.ts
    │       ├── ✅ recharge/route.ts
    │       ├── ✅ transfer/route.ts
    │       ├── ✅ password/route.ts
    │       └── ✅ history/route.ts
    ├── lib/
    │   └── ✅ nauta-client.ts
    ├── hooks/
    │   └── ✅ useNauta.ts
    └── components/
        ├── ✅ LoginPanel.tsx
        ├── ✅ Dashboard.tsx
        ├── ✅ SessionCard.tsx
        ├── ✅ AccountCard.tsx
        └── ✅ RechargeModal.tsx

nauta-extension/            ← pendiente
🔄 Faltan 12 archivos
components/
  [26] TransferModal.tsx
  [27] PasswordModal.tsx
  [28] HistoryTable.tsx

nauta-extension/
  [29] manifest.json
  [30] src/nauta-client.js
  [31] src/background/service-worker.js
  [32] src/popup/popup.html
  [33] src/popup/popup.css
  [34] src/popup/popup.js
  [35] src/options/options.html
  [36] src/options/options.js
  [37] icons/icon.svg

  