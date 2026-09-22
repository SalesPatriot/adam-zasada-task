# FDE Interview Task — Vendor Quote Processing

For this exercise, treat the interviewer as a SalesPatriot client.

A request for quote (RFQ) is sent to one or more suppliers, who respond with quotes for the requested parts. You are working on the page where a buyer processes one of those responses. The page displays the vendor's quote alongside the structured data extracted by our AI system. The buyer's goal is to review and confirm that data as quickly and accurately as possible. They may also need to identify missing information and follow up with the vendor.

The contents of this repository represent version 1 of that page. After reviewing it, the client reported that the experience feels slow and confusing.

Your task is to rebuild the page so the buyer can complete these workflows quickly and efficiently. Everything is open to change except the seed data—the vendor quote examples and their extracted data. The persistence contract—`data/state.json` and `PUT /api/state`—is also fixed.

A form for processing vendor RFQ responses, in two routes:

- `/` — inbox listing each vendor response on the RFQ.
- `/quote/[vendorId]` — detail view: email correspondence on the left, processing form on the right. ← / → switch vendors, Esc returns to the inbox

## What's in the seed

Three vendor responses to one open RFQ for 10 requested parts with uneven requested quantity breaks:

- **Heritage Aero Supply** — replies inline, quotes one alternate PN, omits one requested part, skips a requested price break, and adds an unrequested part.
- **Apex Components LLC** — replies with a PDF quote attachment, quotes one alternate, omits one requested part, supplies different breaks than requested, and adds a related stock line.
- **Northstar Surplus & MRO** — replies through a messy forwarded chain with an obsolete nested revision, a surplus alternate, a no-bid item, and an extra lot item.

Each vendor has fields at the quote header, product, and line levels. Some values come pre-filled, some are intentionally missing, the number of quantity lines varies by product, and the correspondence pane includes an intentionally incomplete follow-up draft that asks for a mix of missing, clarifying, and already-supplied information. (comment: theoretically result of ai extracting this information)

## Submit

When a vendor's processing is done, hit **Submit** in the detail header. That `POST`s `/api/quote/[vendorId]/submit`, the server validates required fields, and (on success) marks the vendor with a `submittedAt` timestamp that surfaces on the inbox.

## Run

```bash
npm install
npm run dev
```

Bun works too: `bun install && bun run dev`. Node 20+ — `.nvmrc` pins 22.

Open [http://localhost:5173](http://localhost:5173). State persists to `data/state.json`; delete that file to reset to the seed.

```bash
npm run check    # svelte-check
npm run build    # production build (adapter-node)
npm run preview  # serve the production build
```



## Layout

```
src/
├── app.css, app.html
├── lib/
│   ├── types.ts                — Vendor, Product, Line, Email, AppState
│   ├── fields.ts               — field metadata + makeEmptyLine
│   ├── seed.ts                 — 3 vendors, 10 parts, uneven quantity breaks
│   ├── avatar.ts               — deterministic avatar colors / initials
│   ├── store.svelte.ts         — reactive store + debounced PUT /api/state, submit
│   ├── server/persistence.ts   — JSON file read/write (data/state.json)
│   └── components/
│       ├── EmailCorrespondence.svelte
│       ├── EmailThread.svelte
│       ├── PdfAttachment.svelte
│       ├── FieldInput.svelte
│       └── VendorProcessingForm.svelte
└── routes/
    ├── +layout.svelte
    ├── +error.svelte
    ├── +page.svelte                          — inbox
    ├── +page.server.ts                       — loads seed/persisted state
    ├── quote/[vendorId]/
    │   ├── +page.svelte                      — detail (email + form, ← / → nav)
    │   └── +page.server.ts
    └── api/
        ├── state/+server.ts                       — GET / PUT
        ├── quote/[vendorId]/submit/+server.ts     — POST
        └── parts/[partNumber]/status/+server.ts   — GET
```



## Data model

`Vendor -> Product[] -> Line[]`. Header-level fields live on `Vendor`, product-level fields live on `Product`, and quote-break fields live on `Line`. Field metadata lives in `HEADER_FIELD_DEFS`, `PRODUCT_FIELD_DEFS`, and `LINE_FIELD_DEFS`.

## Persistence

`store.svelte.ts` debounces 350 ms and `PUT`s the full state to `/api/state`, which writes `data/state.json`. Loads go through `+page.server.ts → loadState()`. No DB, no migrations.