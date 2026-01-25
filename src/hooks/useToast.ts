export const useToast = () => {
  return {
    toast: (options: { title: string; description: string; variant?: string }) => {
      // Implement your toast functionality here
      console.log('Toast:', options);
    },
  };
};