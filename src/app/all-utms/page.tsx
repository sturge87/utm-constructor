import { Suspense } from "react";
import AllUtmsClient from "./AllUtmsClient";

export const dynamic = "force-dynamic";

export default function AllUtmsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AllUtmsClient />
    </Suspense>
  );
} 