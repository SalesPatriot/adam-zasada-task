export type Line = {
	id: string;
	quantity: number;

	isQuoting: boolean | null;
	isFat: boolean | null;
	unitCost: number | null;
	variance: string;
	price: number | null;
	currency: 'USD' | 'EUR' | 'GBP' | '';
	leadTime: number | null;
	additionalNotes: string;
};

export type Product = {
	id: string;
	partNumber: string;
	nsn: string;
	description: string;
	packagingIncluded: boolean | null;
	certifications: string;
	nreCost: number | null;
	coo: string;
	hazmatItem: boolean | null;
	mfrCage: string;
	mfrPartNumber: string;
	shippingIncluded: boolean | null;
	additionalNotes: string;
	lines: Line[];
};

export type EmailAttachment = {
	id: string;
	filename: string;
	pages: string[];
};

export type Email = {
	id: string;
	from: string;
	fromName: string;
	to: string;
	date: string;
	subject: string;
	body: string;
	attachments: EmailAttachment[];
};

export type Vendor = {
	id: string;
	name: string;
	contactName: string;
	contactEmail: string;
	cage: string;
	paymentTerms: string;
	daysQuoteValid: number | null;
	vendorContact: string;
	additionalNotes: string;
	followUpDraft: string;
	submittedAt: string | null;
	emails: Email[];
	products: Product[];
};

export type AppState = {
	vendors: Vendor[];
};
