/**
 * Epos Now API Client
 * Docs: https://developer.eposnowtill.com/
 *
 * Put these in your .env.local:
 *   EPOSNOW_API_TOKEN=your_token_here
 *   EPOSNOW_ACCOUNT_ID=your_account_id_here
 */

const BASE_URL = 'https://api.eposnowtill.com/v1';

function getHeaders() {
  const token = process.env.EPOSNOW_API_TOKEN;
  if (!token) throw new Error('EPOSNOW_API_TOKEN is not set in .env.local');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function eposGetAllProducts() {
  const res = await fetch(`${BASE_URL}/Product`, { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Epos Now error: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function eposGetProduct(id: number) {
  const res = await fetch(`${BASE_URL}/Product/${id}`, { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Epos Now error: ${res.status}`);
  return res.json();
}

export async function eposCreateProduct(data: EposProduct) {
  const res = await fetch(`${BASE_URL}/Product`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Epos Now create error: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function eposUpdateProduct(id: number, data: Partial<EposProduct>) {
  const res = await fetch(`${BASE_URL}/Product/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ Id: id, ...data }),
  });
  if (!res.ok) throw new Error(`Epos Now update error: ${res.status} ${await res.text()}`);
  return res.json();
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function eposGetCategories() {
  const res = await fetch(`${BASE_URL}/Category`, { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Epos Now error: ${res.status}`);
  return res.json();
}

// ─── Transactions / Orders ───────────────────────────────────────────────────

export async function eposCreateTransaction(data: EposTransaction) {
  const res = await fetch(`${BASE_URL}/Transaction`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Epos Now transaction error: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function eposGetTransaction(id: number) {
  const res = await fetch(`${BASE_URL}/Transaction/${id}`, { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Epos Now error: ${res.status}`);
  return res.json();
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export async function eposGetStock(productId: number) {
  const res = await fetch(`${BASE_URL}/Stock?productId=${productId}`, { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Epos Now error: ${res.status}`);
  return res.json();
}

// ─── Map Epos Product → Our MenuItem ─────────────────────────────────────────

export function mapEposProductToMenuItem(eposProduct: any) {
  return {
    name:          eposProduct.Name || '',
    price:         parseFloat(eposProduct.SalePrice) || 0,
    isAvailable:   eposProduct.IsActive !== false,
    eposProductId: eposProduct.Id,
    eposUpdatedAt: new Date(),
    // Description and images are managed on the website side
    // Category mapping — adjust these to match your Epos Now category names
    category:      mapEposCategory(eposProduct.CategoryName || ''),
  };
}

function mapEposCategory(eposCategoryName: string): string {
  const name = eposCategoryName.toLowerCase();
  if (name.includes('chicken'))          return 'fried-chicken';
  if (name.includes('bibimbap'))         return 'bibimbap';
  if (name.includes('rice bowl') || name.includes('bowl')) return 'rice-bowl';
  if (name.includes('noodle') || name.includes('rice'))    return 'noodle';
  if (name.includes('soup') || name.includes('stew'))      return 'soup';
  if (name.includes('side'))             return 'side';
  if (name.includes('drink') || name.includes('coffee') || name.includes('tea')) return 'drink';
  if (name.includes('snack') || name.includes('street'))   return 'snack';
  return 'snack'; // default fallback
}

// Map our Order → Epos Now Transaction format
export function mapOrderToEposTransaction(order: any): EposTransaction {
  return {
    CustomerName:  order.customerName,
    CustomerEmail: order.customerEmail,
    Note:          `Online ${order.orderType} order — ${order.specialInstructions || ''}`.trim(),
    TransactionLines: order.items.map((item: any) => ({
      ProductName: item.name,
      Quantity:    item.quantity,
      UnitPrice:   item.price,
      TotalPrice:  item.price * item.quantity,
    })),
    TotalAmount:   order.total,
    PaymentType:   order.paymentStatus === 'paid' ? 'Card' : 'Cash',
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EposProduct {
  Id?:           number;
  Name:          string;
  SalePrice:     number;
  CategoryId?:   number;
  CategoryName?: string;
  IsActive?:     boolean;
  Barcode?:      string;
  Description?:  string;
}

export interface EposTransaction {
  CustomerName?:    string;
  CustomerEmail?:   string;
  Note?:            string;
  TotalAmount:      number;
  PaymentType?:     string;
  TransactionLines: EposTransactionLine[];
}

export interface EposTransactionLine {
  ProductName: string;
  Quantity:    number;
  UnitPrice:   number;
  TotalPrice:  number;
  ProductId?:  number;
}
