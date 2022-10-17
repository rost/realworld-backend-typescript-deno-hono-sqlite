import { serve } from "std/http/server.ts"

import app from "@/app.ts"

serve(app.fetch)
