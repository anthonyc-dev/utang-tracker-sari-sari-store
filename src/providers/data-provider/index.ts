"use client";

import dataProviderSimpleRest from "@refinedev/simple-rest";

// Next.js API routes (App Router) live under `/api/*`
const API_URL = "/api";

export const dataProvider = dataProviderSimpleRest(API_URL);
