import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

async function run() {
  const parsedUrl = new URL("http://github.com");
  const response = await fetch(parsedUrl.toString(), { redirect: 'manual' });
  console.log("Status:", response.status);
  console.log("Location:", response.headers.get("location"));
}

run();
