# Documentazione tecnica

Questa app è una **galleria fotografica personale**, sviluppata in **Next.js** con **Tailwind CSS** e backend su **Supabase** (auth, storage, DB). Permette agli utenti autenticati di **caricare**, **visualizzare**, **taggare** e **gestire** le proprie foto di viaggio.

---

## `pages/index.tsx` – Homepage

La homepage gestisce:

- Il **controllo della sessione utente** via Supabase (`onAuthStateChange`)
- Il **fetch iniziale delle foto** dal DB con i relativi tag (`supabase.from('photos').select(...tags)`)
- La visualizzazione delle foto tramite il componente `PhotoCard`, ordinate per `created_at`
- Il bottone “Upload” che apre il componente `UploadForm` per caricare nuove foto
- La gestione della **modale di info** (dettagli della foto) e della **modale di conferma eliminazione**
- La cancellazione di una foto coinvolge:
  - eliminazione da tabella `photos`
  - rimozione del file da Supabase Storage (`photo-gallery` bucket)

Contiene anche il `SessionContext`, utile per passare la sessione a componenti figli.

---

## `pages/upload.tsx` – Pagina Upload semplice

Permette all’utente di caricare una **singola foto con titolo**:

- Preleva l’utente loggato da Supabase Auth
- Costruisce un nome file univoco usando `user.id` + timestamp
- Carica la foto nel bucket Supabase Storage (`photo-gallery`)
- Inserisce un nuovo record nella tabella `photos` con `asset_name` e `title`
- Mostra un bottone di stato (Caricamento…)

Questa pagina è pensata per un upload rapido, rispetto a quello più avanzato di `UploadForm`.

---

## `components/UploadForm.tsx` – Componente di upload avanzato

Caratteristiche principali:

- Supporta il **drag & drop multiplo** di immagini
- Anteprima delle immagini (`ImagePreview`)
- Ogni immagine ha un `PreviewCard`:
  - editing del titolo
  - aggiunta di note
  - inserimento di tag (con parsing automatico da stringa)
- Alla conferma dell’upload:
  - ogni immagine viene caricata nel bucket `photo-gallery`
  - viene creato un record in `photos` con `title`, `note`, `file_extension`
  - i tag vengono inseriti in `tags` e collegati in `photo_tags` via ID

Utilizza `useImperativeHandle` per far comunicare i `PreviewCard` figli con il componente padre `UploadForm`.

---

## `components/PhotoCard.tsx` – Card visualizzazione foto

Ogni `PhotoCard` mostra:

- L’immagine scaricata dinamicamente da Supabase Storage (preview trasformata)
- Il titolo dell’immagine
- 3 pulsanti:
  - **Info** (mostra dettagli)
  - **Download** (download originale della foto)
  - **Delete** (chiamata a `deletePhoto`)

La logica di download include:
- uso di `supabase.storage.from(...).download(...)`
- creazione di link `a` DOM per scaricamento

La visualizzazione è responsive e gestita tramite Tailwind.

---

## Considerazioni architetturali

- **Supabase** è utilizzato come backend full-stack:
  - Auth: gestione sessione
  - Storage: immagini
  - DB: tabelle `photos`, `tags`, `photo_tags`
- L’upload avanzato è costruito con un’interfaccia molto curata e gestita con `forwardRef`
- Le immagini vengono visualizzate in lazy loading e rese interattive
- I dati sono reattivi in pagina ma non sincronizzati in tempo reale (manca subscription su `photos`)

---

## Prossimi sviluppi

- Sincronizzazione real-time (via Supabase `realtime`)
- Filtro per tag
- Modalità slideshow / fullscreen
- Miglioramento accessibilità

---


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
