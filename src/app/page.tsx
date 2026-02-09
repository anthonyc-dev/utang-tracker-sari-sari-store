"use client";

import { Suspense } from "react";

import SignInPage from "./(auth)/sign-in/page";

export default function IndexPage() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  );
}
