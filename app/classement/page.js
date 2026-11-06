"use client";

import { createClient } from "@supabase/supabase-js";
import ClassementCommun from "../components/ClassementCommun";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default function ClassementPage() {
  return (
    <main className="container">
      <ClassementCommun supabase={supabase} />
    </main>
  );
}
