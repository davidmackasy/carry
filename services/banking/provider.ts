import type {Account,Transaction} from '@/types/finance';
/** Bank connectors are server-only implementations; credentials never belong in UI state. */
export interface BankingProvider {connect():Promise<{authorizationUrl:string}>;getAccounts():Promise<Account[]>;getBalances():Promise<{accountId:string;balance:number}[]>;getTransactions(since:string):Promise<Transaction[]>;refreshTransactions():Promise<void>}
