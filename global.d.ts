interface Window {
  electronAPI: {
    saveData: (data: any) => Promise<{ success: boolean; error?: string }>;
    loadData: () => Promise<string | null>;
  } | undefined;
}
