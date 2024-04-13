//https://docs.plasmic.app/learn/data-code-components/#workarounds-for-userouter
//This can be used to avoid errors during plasmic/nextjs pre-render
//When the router does not impact data fetching logic

import { useRouter } from 'next/router';

export function useSafeRouter() {
  try {
    return useRouter()
  } catch {
    return undefined;
  }
}