import { localDb } from './local-db';
import { isOnline } from './sync-manager';

// Define browser SpeechRecognition types
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export class VoiceAssistant {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTextChange: (text: string) => void;
  private onError: (err: string) => void;
  private onEnd: () => void;

  constructor(
    onTextChange: (text: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    this.onTextChange = onTextChange;
    this.onError = onError;
    this.onEnd = onEnd;

    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'id-ID'; // Indonesian Language

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const text = finalTranscript || interimTranscript;
          this.onTextChange(text);
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          this.onError(event.error);
          this.isListening = false;
          this.onEnd();
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onEnd();
        };
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      this.onError(e.message || 'Gagal memulai perekaman suara');
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * Regex-based offline fallback parser for common cooperative commands.
 */
async function parseCommandOffline(command: string): Promise<any> {
  const normalized = command.toLowerCase().trim();

  // Load local context for matching
  const localCommodities = localDb ? await localDb.commodities.toArray() : [];
  const localMembers = localDb ? await localDb.members.toArray() : [];

  // Helper: Find closest match in array
  const findCommodity = (name: string) => {
    return localCommodities.find((c: any) => name.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(name));
  };
  const findMember = (name: string) => {
    return localMembers.find((m: any) => name.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(name));
  };

  // 1. Sales matching: "jual [jumlah] [produk] ke [anggota]"
  // e.g. "jual 3 rak telur ke budi", "jual beras 5 kilo"
  const saleRegex = /(jual|kasir)\s+(\d+)\s*(kilo|kg|butir|rak|liter|karung|kwintal)?\s*([a-zA-Z\s]+?)(?:\s+(?:ke|kepada|untuk)\s+([a-zA-Z\s]+))?$/i;
  let match = normalized.match(saleRegex);
  if (match) {
    const qty = parseInt(match[2]);
    const unit = match[3] || 'Kg';
    const prodName = match[4].trim();
    const buyerName = match[5] ? match[5].trim() : '';

    const matchedProd = findCommodity(prodName);
    const matchedMem = buyerName ? findMember(buyerName) : undefined;

    return {
      action: 'create_sale',
      payload: {
        items: [{
          commodity_id: matchedProd?.id || 'new-product-offline',
          commodity_name: matchedProd?.name || prodName,
          quantity: qty,
          price_per_kg: 12000, // mock fallback price
          unit: matchedProd?.unit || unit
        }],
        memberName: matchedMem?.name || buyerName || 'Pelanggan Umum',
        memberId: matchedMem?.id || null,
        paymentMethod: 'Tunai'
      },
      confirmation_message: `[Offline Mode] Saya akan mencatat penjualan ${qty} ${matchedProd?.unit || unit} ${matchedProd?.name || prodName} kepada ${matchedMem?.name || buyerName || 'Pelanggan Umum'}. Apakah benar?`
    };
  }

  // 2. Stock updates matching: "tambah stok [produk] [jumlah]" / "kurangi stok..."
  // e.g. "tambah stok gula 20 kilo", "kurangi stok telur 10"
  const stockRegex = /(tambah|kurangi|ubah|set)\s+stok\s+([a-zA-Z\s]+?)\s+(\d+)\s*(kilo|kg|butir|rak|liter|karung|ton)?$/i;
  match = normalized.match(stockRegex);
  if (match) {
    const op = match[1] === 'tambah' ? 'add' : match[1] === 'kurangi' ? 'reduce' : 'set';
    const prodName = match[2].trim();
    const qty = parseInt(match[3]);
    const unit = match[4] || 'Kg';

    const matchedProd = findCommodity(prodName);

    return {
      action: 'update_stock',
      payload: {
        commodity_id: matchedProd?.id || 'new-product-offline',
        commodity_name: matchedProd?.name || prodName,
        quantity: qty,
        unit: matchedProd?.unit || unit,
        operation: op
      },
      confirmation_message: `[Offline Mode] Saya akan ${op === 'add' ? 'menambahkan' : op === 'reduce' ? 'mengurangi' : 'mengubah'} stok ${matchedProd?.name || prodName} sebanyak ${qty} ${matchedProd?.unit || unit}. Apakah benar?`
    };
  }

  // 3. Purchases matching: "beli [jumlah] [produk] dari [supplier]"
  // e.g. "beli 5 karung beras dari pak budi", "beli minyak 10 liter dari supplier"
  const purchaseRegex = /(beli|purchase|terima)\s+(\d+)\s*(karung|dus|liter|kg|kilo)?\s*([a-zA-Z\s]+?)\s+(?:dari|oleh)\s+([a-zA-Z\s]+)$/i;
  match = normalized.match(purchaseRegex);
  if (match) {
    const qty = parseInt(match[2]);
    const unit = match[3] || 'Kg';
    const prodName = match[4].trim();
    const supplier = match[5].trim();

    const matchedProd = findCommodity(prodName);

    return {
      action: 'create_purchase',
      payload: {
        items: [{
          commodity_id: matchedProd?.id || 'new-product-offline',
          commodity_name: matchedProd?.name || prodName,
          quantity: qty,
          price_per_kg: 8000, // mock buy price
          unit: matchedProd?.unit || unit
        }],
        supplierName: supplier
      },
      confirmation_message: `[Offline Mode] Saya akan mencatat pembelian ${qty} ${matchedProd?.unit || unit} ${matchedProd?.name || prodName} dari ${supplier}. Apakah benar?`
    };
  }

  // 4. Query stock: "berapa stok cabai"
  const queryRegex = /(berapa|tampilkan|cek)?\s*stok\s+([a-zA-Z\s]+)$/i;
  match = normalized.match(queryRegex);
  if (match) {
    const prodName = match[2].trim();
    const matchedProd = findCommodity(prodName);

    return {
      action: 'query_stock',
      payload: {
        commodity_name: matchedProd?.name || prodName
      },
      confirmation_message: matchedProd 
        ? `Stok ${matchedProd.name} saat ini adalah ${matchedProd.available_stock} ${matchedProd.unit}.`
        : `Komoditas ${prodName} tidak ditemukan di inventori lokal.`
    };
  }

  // 5. Financial reports: "hari ini omzet berapa"
  const reportKeywords = /(omzet|laporan|terlaris|paling\s+laku)/i;
  if (reportKeywords.test(normalized)) {
    let reportType = 'revenue_today';
    let friendly = 'omzet hari ini';
    if (normalized.includes('minggu')) {
      reportType = 'revenue_week';
      friendly = 'laporan penjualan minggu ini';
    } else if (normalized.includes('terlaris') || normalized.includes('laku')) {
      reportType = 'best_selling';
      friendly = 'produk paling laris';
    } else if (normalized.includes('anggota')) {
      reportType = 'active_members';
      friendly = 'keaktifan anggota';
    }

    return {
      action: 'reporting',
      payload: { reportType },
      confirmation_message: `[Offline Mode] Menyiapkan ${friendly} berdasarkan basis data lokal.`
    };
  }

  // Default response if not recognized
  return {
    action: 'query_stock',
    payload: { commodity_name: command },
    confirmation_message: `Maaf, saya tidak memahami perintah offline Anda. Silakan coba perintah standar seperti: 'jual 5 kg jagung' atau 'tambah stok gula 10 kg'.`
  };
}

/**
 * Processes text commands using Gemini online, falling back to local regex parsing if offline.
 */
export async function executeAICommand(commandText: string): Promise<any> {
  const online = isOnline();

  // If offline, parse locally immediately
  if (!online) {
    console.log('Device is offline. Executing offline regex command parser fallback.');
    return parseCommandOffline(commandText);
  }

  try {
    // Collect local database context to help LLM resolve entities
    const commodities = localDb ? await localDb.commodities.toArray() : [];
    const members = localDb ? await localDb.members.toArray() : [];

    const response = await fetch('/api/ai-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: commandText,
        commodities,
        members
      })
    });

    if (!response.ok) {
      throw new Error(`AI API failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('AI command online endpoint failed. Falling back to local offline parser:', error);
    return parseCommandOffline(commandText);
  }
}
