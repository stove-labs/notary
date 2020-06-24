import { address, signatures, signees, signature, signee, Storage } from './types'
import { ContractMethod, WalletContract } from '@taquito/taquito/dist/types/contract/contract'
import { Tezos, TezosToolkit, Wallet } from '@taquito/taquito'
import { NotarizedDocument } from './notarizedDocument'
import { Document } from './document'
/**
 * SDK for the Stove Labs' Notary contract
 */
class TezosNotarySDK {
  constructor(public contract: WalletContract) {}

  /**
   * Return typed Taquito storage
   */
  get storage(): Promise<Storage> {
    return this.contract.storage<Storage>()
  }

  /**
   * Fetch the document by a hash from the contract's storage
   * and map it to a NotarizedDocument
   * @param document
   */
  public async getDocument(document: Document): Promise<NotarizedDocument> {
    const storage: Storage = await this.storage
    const signatures: signatures = await storage.get(document.hash)
    if (signatures === undefined) {
      throw new Error('no signatures specified')
    }
    return new NotarizedDocument(document.hash, signatures)
  }

  /**
   * Check if the given document(hash) exists in the contract,
   * if not return false
   * @param document
   */
  public async isNotarized(document: Document): Promise<boolean> {
    try {
      await this.getDocument(document)
    } catch (error) {
      if (error.message === 'no signatures specified') return false
    }

    return true
  }

  /**
   * Compose a notarization operation for the provided Document
   * @param document
   */
  public notarize(document: Document): ContractMethod<Wallet> {
    return this.contract.methods.notarizeDocument(document.hash, document.signees)
  }

  /**
   * Compose a signing operation for the provided notarized document
   * @param document
   */
  public sign(document: NotarizedDocument): ContractMethod<Wallet> {
    return this.contract.methods.signDocument(document.hash)
  }
}

/**
 * Factory / wrapper to instantiate the TezosNotarySDK with the required parameters
 */
const TezosNotarySDKFactory = {
  at: async (address: address, tezos: TezosToolkit = Tezos): Promise<TezosNotarySDK> => {
    const contract: WalletContract = await tezos.wallet.at(address)
    return new TezosNotarySDK(contract)
  }
}

export * from './types'
export * from './document'
export * from './notarizedDocument'
export { TezosNotarySDK, TezosNotarySDKFactory }
