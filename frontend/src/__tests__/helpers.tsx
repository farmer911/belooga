import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";

export type Reply = { status?: number; data?: unknown };
export type Handler = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>;

/** Routes every request from `apiClient` and the global `axios` through `handler`, with real interceptors. */
export function mockApi(handler: Handler) {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const { status = 200, data = null } = await handler(config);
    const response = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, config, null, response);
  };
  apiClient.defaults.adapter = adapter;
  axios.defaults.adapter = adapter;
  return calls;
}

export function queryWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
