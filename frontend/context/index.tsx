import { useState, useEffect } from 'react'
import UniversalProvider from '@walletconnect/universal-provider'
import { initializeModal, initializeProvider } from '@/config/appKit';

export function App() {
  const [provider, setProvider] = useState<UniversalProvider>();
  const [session, setSession] = useState<any>();

  
  // Initialize the Provider and AppKit on component mount, and check for existing session
  useEffect(() => {
    const init = async () => {
      const dataProvider = await initializeProvider();
      setProvider(dataProvider);
      initializeModal(dataProvider);

      if (dataProvider.session) { // check if there is a session
        setSession(dataProvider.session);
      }
    }
    init()
  }, [])


  useEffect(() => {
    // Handler for when WalletConnect generates a connection URI
    // Opens the AppKit modal with the URI and shows the connecting view
    const handleDisplayUri = (uri: string) => {
      const modal = initializeModal(provider)
      modal?.open({ uri, view: 'ConnectingWalletConnectBasic' })
    }

    // Handler for when a wallet successfully connects
    // Updates the session state and closes the modal
    const handleConnect = async (session: any) => {
      setSession(session.session);
      const modal = initializeModal(provider)
      await modal?.close()
    }

    // Subscribe to WalletConnect events
    provider?.on('display_uri', handleDisplayUri) // Listen for connection URI
    provider?.on('connect', handleConnect) // Listen for successful connections

    return () => {
      provider?.removeListener('connect', handleConnect)
      provider?.removeListener('display_uri', handleDisplayUri)
    }
  }, [provider])

}