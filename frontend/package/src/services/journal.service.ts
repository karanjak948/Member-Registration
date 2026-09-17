import api from "@/services/api";

export interface JournalEntryLine {
  id?: number;
  index?: number;
  account_id?: number | string;
  account_no?: string;
  account_name?: string;
  account_code?: string;
  jv_no?: string;
  particular?: string;
  document_no?: string;
  transaction_date?: string;
  debit?: number | string;
  credit?: number | string;
}

export interface PostGeneralJournalPayload {
  jv_no?: string;
  transaction_date?: string;
  document_no?: string;
  description?: string;
  money_from: {
    account_id: number | string;
    particular: string;
    document_no?: string;
    transaction_date?: string;
    debit?: number | string;
    credit?: number | string;
  };
  money_to: {
    account_id: number | string;
    particular: string;
    document_no?: string;
    transaction_date?: string;
    debit?: number | string;
    credit?: number | string;
  };
}

export interface PostBroughtForwardPayload {
  account_no: number | string;
  particular: string;
  document_no?: string;
  transaction_date?: string;
  debit?: number | string;
  credit?: number | string;
  jv_no?: string;
}

class JournalService {
  async getNextJvNo(): Promise<string> {
    const res = await api.get<{ jv_no: string }>("/ledger-transactions/next-jv-no/");
    return res.data.jv_no || "79400";
  }

  async postGeneralJournal(payload: PostGeneralJournalPayload) {
    const res = await api.post("/ledger-transactions/post-general-journal/", payload);
    return res.data;
  }

  async postBroughtForward(payload: PostBroughtForwardPayload) {
    const res = await api.post("/ledger-transactions/post-brought-forward/", payload);
    return res.data;
  }

  async getJournalEntriesList(params?: {
    account_no?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }) {
    const res = await api.get("/ledger-transactions/journal-entries-list/", { params });
    return res.data;
  }
}

const journalService = new JournalService();
export default journalService;
