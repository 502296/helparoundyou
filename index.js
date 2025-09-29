import express from "express";

import { createClient } from "@supabase/supabase-js";



const app = express();

const PORT = process.env.PORT || 3000;



// Supabase setup

const supabase = createClient(

  process.env.SUPABASE_URL,

  process.env.SUPABASE_KEY

);



app.get("/", (req, res) => {

  res.send("🚀 HelpAroundYou is running on Vercel with Supabase!");

});



app.listen(PORT, () => {

  console.log(`✅ Server running on http://localhost:${PORT}`);

});
