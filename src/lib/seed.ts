import type { AppState, Email, Line, Product, Vendor } from './types';
import { makeEmptyLine } from './fields';

type PartDef = {
	pn: string;
	nsn: string;
	desc: string;
};

const REQUESTED_PARTS: PartDef[] = [
	{ pn: 'MS27039-1-08', nsn: '5305-00-984-6210', desc: 'Screw, machine, pan head' },
	{ pn: 'NAS1149F0832P', nsn: '5310-00-167-0816', desc: 'Washer, flat, aluminum' },
	{ pn: 'MS21042L3', nsn: '5310-00-855-1257', desc: 'Nut, self-locking, hex' },
	{ pn: 'M83248/1-006', nsn: '5330-01-130-1932', desc: 'O-Ring, packing, preformed' },
	{ pn: 'AN960-10', nsn: '5310-00-167-0822', desc: 'Washer, flat' },
	{ pn: 'MS35206-228', nsn: '5305-00-984-4988', desc: 'Screw, machine, pan head, cad plated' },
	{ pn: 'MS9556-04', nsn: '4730-00-289-5226', desc: 'Plug, machine thread' },
	{ pn: 'NAS1351-3H8', nsn: '5305-00-728-7891', desc: 'Screw, socket head cap' },
	{ pn: 'MS17985C411', nsn: '5315-00-839-5824', desc: 'Pin, clevis, headed' },
	{ pn: 'AN3-12A', nsn: '5306-00-826-2519', desc: 'Bolt, machine, hex head' }
];

const REQUESTED_QTY_TIERS = [
	[100, 250, 500],
	[50, 200],
	[25, 100, 250, 500],
	[10, 50],
	[5, 25, 100],
	[75, 150],
	[12, 48, 96, 192],
	[20, 60],
	[15, 30, 90],
	[25, 100]
];

const HERITAGE_PARTS: PartDef[] = [
	...REQUESTED_PARTS.map((p, i) =>
		i === 1
			? { pn: 'NAS1149F0832P-ALT', nsn: p.nsn, desc: 'Alternate washer, flat, aluminum' }
			: p
	),
	{ pn: 'MS24665-283', nsn: '5305-00-068-0501', desc: 'Extra screw, countersunk, unrequested' }
];

const APEX_PARTS: PartDef[] = [
	...REQUESTED_PARTS.map((p, i) =>
		i === 5
			? { pn: 'MS35206-228-AC', nsn: p.nsn, desc: 'Alternate screw, machine, cad plated' }
			: p
	),
	{ pn: 'NAS1149F0332P', nsn: '5310-00-167-0823', desc: 'Extra washer offered as related stock' }
];

const NORTHSTAR_PARTS: PartDef[] = [
	...REQUESTED_PARTS.map((p, i) =>
		i === 7 ? { pn: 'NAS1351-3H8-NS', nsn: p.nsn, desc: 'Surplus alternate socket head cap screw' } : p
	),
	{ pn: 'AN4-7A', nsn: '5306-00-151-3165', desc: 'Extra bolt found in same lot' }
];

const HERITAGE_TIERS = [
	[100, 500],
	[50, 200],
	[25, 100, 250, 500],
	[10, 50],
	[],
	[75],
	[12, 48, 96],
	[20, 60],
	[30, 90],
	[25, 100],
	[30, 60]
];

const APEX_TIERS = [
	[100, 250, 500],
	[50],
	[100, 250],
	[10, 25, 50],
	[5, 25, 100],
	[75, 150],
	[12, 96],
	[20, 60],
	[],
	[25],
	[40]
];

const NORTHSTAR_TIERS = [
	[100],
	[50, 200],
	[25, 100, 500],
	[10],
	[],
	[75, 150],
	[12, 48, 96, 192],
	[20, 60],
	[15],
	[25, 100],
	[8, 24]
];

type ProductPatch = Partial<Omit<Product, 'id' | 'description' | 'lines'>>;

function buildProducts(parts: readonly PartDef[], tiers: readonly number[][]): Product[] {
	return parts.map((p, i) => ({
		id: crypto.randomUUID(),
		partNumber: p.pn,
		nsn: p.nsn,
		description: p.desc,
		packagingIncluded: null,
		certifications: '',
		nreCost: null,
		coo: '',
		hazmatItem: null,
		mfrCage: '',
		mfrPartNumber: '',
		shippingIncluded: null,
		additionalNotes: '',
		lines: (tiers[i] ?? []).map((qty) => makeEmptyLine(qty))
	}));
}

function patchProducts(products: Product[], patches: readonly ProductPatch[]): Product[] {
	return products.map((product, i) => ({ ...product, ...patches[i] }));
}

function currencyFor(vendorIdx: number): Line['currency'] {
	return vendorIdx === 2 ? 'EUR' : 'USD';
}

function fillLines(products: Product[], vendorIdx: number): Product[] {
	return products.map((product, productIdx) => ({
		...product,
		lines: product.lines.map((line, lineIdx) => {
			const missingPrice = (productIdx + lineIdx + vendorIdx) % 11 === 0;
			if (missingPrice) {
				return {
					...line,
					isQuoting: true,
					additionalNotes: 'Vendor left one commercial value unclear.'
				} satisfies Line;
			}

			const base = 1.74 + productIdx * (vendorIdx === 2 ? 0.61 : 0.47) + vendorIdx * 0.21;
			const discount = 1 - lineIdx * (vendorIdx === 1 ? 0.055 : 0.07);
			const unitCost = Number((base * discount).toFixed(2));
			const price = Number((unitCost * line.quantity).toFixed(2));
			const isFat = productIdx === 0 && lineIdx === 0;

			return {
				...line,
				isQuoting: true,
				isFat,
				unitCost,
				variance: lineIdx === 0 ? (productIdx % 2 === 0 ? '+2.5%' : '-1.0%') : '',
				price,
				currency: currencyFor(vendorIdx),
				leadTime: 18 + ((productIdx * 6 + lineIdx * 9 + vendorIdx * 7) % 86),
				additionalNotes: isFat ? 'FAT price and lead time called out by vendor.' : ''
			} satisfies Line;
		})
	}));
}

function requestedList(): string {
	return REQUESTED_PARTS.map((p, i) => {
		const requestedBreaks = REQUESTED_QTY_TIERS[i].join('/');
		return `${i + 1}. ${p.pn} | NSN ${p.nsn} | requested qty breaks ${requestedBreaks}`;
	}).join('\n');
}

function initialRequestBody(vendorName: string): string {
	return [
		`Hi ${vendorName} team,`,
		'',
		'Please quote the parts below. Requested quantity breaks are listed per part; quote exact PN where possible and call out any alternate explicitly.',
		'Do not add substitute or extra parts unless you mark them as alternates or unrequested stock.',
		'Please include payment terms, quote validity, vendor contact, and for each quoted product: packaging, certs, NRE, COO, hazmat, NSN, mfr CAGE, mfr PN, shipping, and any notes.',
		'',
		requestedList(),
		'',
		'Need pricing by 5/20.',
		'',
		'Thanks,',
		'Argus Defense RFQ Desk'
	].join('\n');
}

function quoteLineRows(vendorIdx: number, productIdx: number, tiers: readonly number[]): string {
	return tiers
		.map((qty, lineIdx) => {
			const base = 1.74 + productIdx * (vendorIdx === 2 ? 0.61 : 0.47) + vendorIdx * 0.21;
			const unit = Number((base * (1 - lineIdx * (vendorIdx === 1 ? 0.055 : 0.07))).toFixed(2));
			const price = Number((unit * qty).toFixed(2));
			const lead = 18 + ((productIdx * 6 + lineIdx * 9 + vendorIdx * 7) % 86);
			return `      qty ${qty}: ${currencyFor(vendorIdx)} ${unit.toFixed(2)} ea / ${price.toFixed(
				2
			)} ext / ${lead}d`;
		})
		.join('\n');
}

function productQuoteRows(
	vendorIdx: number,
	parts: readonly PartDef[],
	tiers: readonly number[][],
	patches: readonly ProductPatch[],
	format: 'inline' | 'pdf' | 'messy'
): string {
	return parts
		.map((p, i) => {
			const patch = patches[i] ?? {};
			const requested = i < REQUESTED_PARTS.length ? REQUESTED_PARTS[i] : null;
			const suppliedTiers = tiers[i] ?? [];
			const prefix = format === 'messy' ? `${i + 1})` : `${i + 1}.`;

			if (suppliedTiers.length === 0) {
				return [
					`${prefix} ${requested?.pn ?? p.pn}`,
					'   NO QUOTE / OMITTED FROM PRICE TABLE',
					`   desc: ${requested?.desc ?? p.desc}`,
					`   note: ${patch.additionalNotes || 'vendor did not provide pricing on this line'}`
				].join('\n');
			}

			const productLabel = !requested
				? `${p.pn} (extra stock)`
				: requested.pn === p.pn
					? p.pn
					: `${p.pn} (ALT for ${requested.pn})`;

			return [
				`${prefix} ${productLabel}`,
				`   NSN ${p.nsn}`,
				`   desc: ${p.desc}`,
				`   mfr PN ${patch.mfrPartNumber ?? p.pn}; mfr CAGE ${patch.mfrCage ?? ''}; COO ${
					patch.coo || 'not stated'
				}; hazmat ${patch.hazmatItem === true ? 'yes' : patch.hazmatItem === false ? 'no' : 'not stated'}`,
				`   packaging ${
					patch.packagingIncluded === true
						? 'included'
						: patch.packagingIncluded === false
							? 'not included'
							: 'not stated'
				}; shipping ${
					patch.shippingIncluded === true
						? 'included'
						: patch.shippingIncluded === false
							? 'not included'
							: 'not stated'
				}; certs ${patch.certifications || 'not stated'}; NRE ${
					patch.nreCost === null || patch.nreCost === undefined ? 'none stated' : `${patch.nreCost}`
				}`,
				patch.additionalNotes ? `   product note: ${patch.additionalNotes}` : '',
				quoteLineRows(vendorIdx, i, suppliedTiers)
			]
				.filter(Boolean)
				.join('\n');
		})
		.join('\n\n');
}

const HERITAGE_PRODUCTS: ProductPatch[] = HERITAGE_PARTS.map((p, i) => ({
	packagingIncluded: i === 10 ? false : true,
	certifications: [0, 2, 5, 7].includes(i) ? 'C of C; DFARS' : 'C of C',
	nreCost: i === 0 ? 285 : null,
	coo: i === 3 ? 'CA' : 'US',
	hazmatItem: i === 3,
	mfrCage: [0, 3, 6, 9].includes(i) ? '1A2B3' : '0K8G6',
	mfrPartNumber: p.pn,
	shippingIncluded: i === 10 ? true : false,
	additionalNotes:
		i === 0
			? 'FAT applies to the first line shown.'
			: i === 1
				? 'Alternate offered for NAS1149F0832P.'
			: i === 4
					? 'No bid.'
					: i === 10
						? 'Extra stock item offered.'
						: ''
}));

const APEX_PRODUCTS: ProductPatch[] = APEX_PARTS.map((p, i) => ({
	packagingIncluded: [1, 2, 7].includes(i),
	certifications: i === 7 ? 'C of C; FAA 8130' : 'C of C',
	nreCost: null,
	coo: [3, 5, 6].includes(i) ? 'MX' : 'US',
	hazmatItem: i === 3,
	mfrCage: '7C9X2',
	mfrPartNumber: p.pn,
	shippingIncluded: [1, 2, 7].includes(i),
	additionalNotes:
		i === 5
			? 'Alternate PN offered for MS35206-228.'
			: i === 8
				? 'No bid in attached price table.'
				: i === 10
					? 'Extra related washer line added by vendor.'
					: ''
}));

const NORTHSTAR_PRODUCTS: ProductPatch[] = NORTHSTAR_PARTS.map((p, i) => ({
	packagingIncluded: [0, 2, 3, 5, 7, 9].includes(i) ? true : i === 4 ? null : false,
	certifications: i === 3 ? 'C of C; EASA tag' : i === 6 ? 'No cert' : 'C of C',
	nreCost: null,
	coo: i === 7 ? 'US' : [1, 4].includes(i) ? '' : 'DE',
	hazmatItem: i === 3 ? true : i === 4 ? null : false,
	mfrCage: 'NS9D1',
	mfrPartNumber: p.pn,
	shippingIncluded: [0, 5].includes(i) ? true : i === 4 ? null : false,
	additionalNotes:
		i === 4
			? 'No bid; forwarded note says superseded and needs clean PN.'
			: i === 7
				? 'Surplus alternate for NAS1351-3H8.'
				: i === 10
					? 'Extra lot item included in forwarded rev 3.'
					: ''
}));

function buildVendor1Emails(): Email[] {
	const sentDate = '2026-05-12T14:22:00Z';
	const replyDate = '2026-05-14T09:48:00Z';

	const reply = [
		'Hi Sales Team,',
		'',
		'Header: payment terms NET 30. Quote valid 30 days. Contact Mike Henderson, mike@heritage-aero.example, (716) 555-0188.',
		'Header note: prices firm through validity period and subject to prior sale.',
		'',
		productQuoteRows(0, HERITAGE_PARTS, HERITAGE_TIERS, HERITAGE_PRODUCTS, 'inline'),
		'',
		'Best,',
		'Mike Henderson',
		'Heritage Aero Supply | cage 1A2B3'
	].join('\n');

	return [
		{
			id: crypto.randomUUID(),
			from: 'rfq@argus-defense.example',
			fromName: 'Argus Defense RFQ Desk',
			to: 'mike@heritage-aero.example',
			date: sentDate,
			subject: 'RFQ - 10 parts due 5/20',
			body: initialRequestBody('Heritage'),
			attachments: []
		},
		{
			id: crypto.randomUUID(),
			from: 'mike@heritage-aero.example',
			fromName: 'Mike Henderson',
			to: 'rfq@argus-defense.example',
			date: replyDate,
			subject: 'Re: RFQ - 10 parts due 5/20',
			body: reply,
			attachments: []
		}
	];
}

function buildVendor2Emails(): Email[] {
	const sentDate = '2026-05-12T14:22:00Z';
	const replyDate = '2026-05-15T17:11:00Z';

	const pdfText = [
		'                APEX COMPONENTS LLC',
		'                Quote #Q-AC-44218',
		'                Date: 5/15/26     Valid: 45 days',
		'                Payment Terms: 2% 10 Net 45',
		'                Vendor Contact: Janet Cole, sales@apex-components.example',
		'                CAGE 7C9X2     FOB Phoenix AZ',
		'-------------------------------------------------------------',
		'',
		productQuoteRows(1, APEX_PARTS, APEX_TIERS, APEX_PRODUCTS, 'pdf'),
		'',
		'-------------------------------------------------------------',
		'Header notes: minimum order $250. All pricing subject to prior sale.',
		'Janet Cole',
		'Apex Components LLC'
	].join('\n');

	return [
		{
			id: crypto.randomUUID(),
			from: 'rfq@argus-defense.example',
			fromName: 'Argus Defense RFQ Desk',
			to: 'sales@apex-components.example',
			date: sentDate,
			subject: 'RFQ - 10 parts due 5/20',
			body: initialRequestBody('Apex'),
			attachments: []
		},
		{
			id: crypto.randomUUID(),
			from: 'sales@apex-components.example',
			fromName: 'Janet Cole',
			to: 'rfq@argus-defense.example',
			date: replyDate,
			subject: 'Re: RFQ - 10 parts due 5/20 (quote attached)',
			body:
				'Hi,\n\nPlease see attached quote. We quoted one alternate and added one related stock line. Valid 45 days.\n\nThanks,\nJanet',
			attachments: [
				{
					id: crypto.randomUUID(),
					filename: 'apex-quote-Q-AC-44218.pdf',
					pages: [pdfText]
				}
			]
		}
	];
}

function buildVendor3Emails(): Email[] {
	const sentDate = '2026-05-12T14:22:00Z';
	const firstReplyDate = '2026-05-16T01:38:00Z';
	const finalReplyDate = '2026-05-16T13:04:00Z';

	const messyReply = [
		'Forwarding the latest from our EU desk. Sorry for the ugly chain.',
		'Header: use Ravi as contact for anything commercial. Terms are prepay first order, then NET 15.',
		'Quote valid is "end of June" - call it 40 days from today.',
		'Header note: do not use the older prices lower in the chain.',
		'',
		'---- Forwarded message ----',
		'From: Elena Voss <elena@northstar-surplus.example>',
		'Sent: Sat, May 16, 2026 at 08:41',
		'To: Ravi Singh <ravi@northstar-surplus.example>',
		'Subject: RE: Argus list -- rev 3 clean-ish',
		'',
		'Ravi - rev3 below. Rev2 is below my signature but ignore it.',
		'',
		productQuoteRows(2, NORTHSTAR_PARTS, NORTHSTAR_TIERS, NORTHSTAR_PRODUCTS, 'messy'),
		'',
		'elena',
		'',
		'-----Original Message-----',
		'From: Ravi Singh',
		'Sent: Friday, May 15, 2026 22:19',
		'Subject: RE: Argus list -- rev 2',
		'',
		'IGNORE THIS REVISION: old unit costs were in USD and lead times were before warehouse check.',
		'Item 1 100ea 2.11 LT20; item 3 25ea 3.90 LT40; item 4 was not haz flagged yet.',
		'',
		'On May 12, Argus Defense RFQ Desk wrote:',
		'> Please quote the 10 part list with product details and quantity breaks where possible.',
		'> Need pricing by 5/20.'
	].join('\n');

	return [
		{
			id: crypto.randomUUID(),
			from: 'rfq@argus-defense.example',
			fromName: 'Argus Defense RFQ Desk',
			to: 'ravi@northstar-surplus.example',
			date: sentDate,
			subject: 'RFQ - 10 parts due 5/20',
			body: initialRequestBody('Northstar'),
			attachments: []
		},
		{
			id: crypto.randomUUID(),
			from: 'ravi@northstar-surplus.example',
			fromName: 'Ravi Singh',
			to: 'rfq@argus-defense.example',
			date: firstReplyDate,
			subject: 'Fwd: RE: Argus list -- rev 2 maybe final',
			body:
				'Team - quick forward for visibility. Please wait for Elena to clean this up before entering anything.\n\nRavi',
			attachments: []
		},
		{
			id: crypto.randomUUID(),
			from: 'ravi@northstar-surplus.example',
			fromName: 'Ravi Singh',
			to: 'rfq@argus-defense.example',
			date: finalReplyDate,
			subject: 'Fwd: RE: Argus list -- rev 3 clean-ish',
			body: messyReply,
			attachments: []
		}
	];
}

export function buildSeedState(): AppState {
	const vendor1: Vendor = {
		id: crypto.randomUUID(),
		name: 'Heritage Aero Supply',
		contactName: 'Mike Henderson',
		contactEmail: 'mike@heritage-aero.example',
		cage: '1A2B3',
		paymentTerms: 'NET 30',
		daysQuoteValid: 30,
		vendorContact: 'Mike Henderson, mike@heritage-aero.example, (716) 555-0188',
		additionalNotes: 'Prices firm through validity period. Subject to prior sale.',
		followUpDraft:
			'Hi Mike,\n\nThanks for the quote. Can you send pricing for the missing AN960-10 line and confirm whether the alternate NAS1149F0832P-ALT is acceptable against the requested NAS1149F0832P?\n\nAlso, can you confirm payment terms and whether shipping is included on item 1? Please provide the missing 250-piece break for MS27039-1-08 if available.\n\nThanks,',
		submittedAt: null,
		emails: buildVendor1Emails(),
		products: fillLines(patchProducts(buildProducts(HERITAGE_PARTS, HERITAGE_TIERS), HERITAGE_PRODUCTS), 0)
	};

	const vendor2: Vendor = {
		id: crypto.randomUUID(),
		name: 'Apex Components LLC',
		contactName: 'Janet Cole',
		contactEmail: 'sales@apex-components.example',
		cage: '7C9X2',
		paymentTerms: '2% 10 Net 45',
		daysQuoteValid: 45,
		vendorContact: 'Janet Cole, sales@apex-components.example',
		additionalNotes: 'Minimum order $250. Pricing subject to prior sale.',
		followUpDraft:
			'Hi Janet,\n\nCould you please quote MS17985C411? It looks missing from the attachment. Also clarify whether MS35206-228-AC is a direct alternate for MS35206-228, and send the 200-piece break for NAS1149F0832P if you have it.\n\nCan you also confirm quote validity and COO for item 4?\n\nThanks,',
		submittedAt: null,
		emails: buildVendor2Emails(),
		products: fillLines(patchProducts(buildProducts(APEX_PARTS, APEX_TIERS), APEX_PRODUCTS), 1)
	};

	const vendor3: Vendor = {
		id: crypto.randomUUID(),
		name: 'Northstar Surplus & MRO',
		contactName: 'Ravi Singh',
		contactEmail: 'ravi@northstar-surplus.example',
		cage: 'NS9D1',
		paymentTerms: 'Prepay first order, then NET 15',
		daysQuoteValid: 40,
		vendorContact: 'Ravi Singh, ravi@northstar-surplus.example',
		additionalNotes: 'Use rev 3 forwarded reply only; older nested prices are obsolete.',
		followUpDraft:
			'Hi Ravi,\n\nCan you confirm the final revision is rev 3 and provide pricing for AN960-10? Please also clarify whether NAS1351-3H8-NS is an approved alternate for NAS1351-3H8.\n\nWe also need payment terms, quote validity, and COO for item 2.\n\nThanks,',
		submittedAt: null,
		emails: buildVendor3Emails(),
		products: fillLines(
			patchProducts(buildProducts(NORTHSTAR_PARTS, NORTHSTAR_TIERS), NORTHSTAR_PRODUCTS),
			2
		)
	};

	return {
		vendors: [vendor1, vendor2, vendor3]
	};
}
