"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ConfigurePOClient from "./ConfigurePOClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-8 font-mono">Loading supplier configuration...</div>}>
      <ConfigurePOClient />
    </Suspense>
  );
}
