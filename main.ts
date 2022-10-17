import { serve } from "std/http/server.ts";

import app from "@/app.ts";

app.database.initialise("conduit");

serve(app.api.fetch);
