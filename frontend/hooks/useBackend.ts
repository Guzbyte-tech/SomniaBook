export function useBackend() {
    const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL
    
    const createTransactionLog = async (data: any) => {
        const response = await fetch(`${backend_url}/transaction/post`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return response.json();
    };

    
  const fetchLogByVaultId = async (vaultId: number) => {
    const response = await fetch(`${backend_url}/transaction/${vaultId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch logs: ${response.status} ${text}`);
    }

    return response.json();
  };

    return {
        createTransactionLog,
        fetchLogByVaultId
    }


}