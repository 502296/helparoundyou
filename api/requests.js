import { createClient } from "@supabase/supabase-js";



const supabase = createClient(

  process.env.SUPABASE_URL,

  process.env.SUPABASE_KEY

);



export default async function handler(req, res) {

  if (req.method === "POST") {

    const { title, description, category, zip, date, time, contact } = req.body;



    const { data, error } = await supabase

      .from("requests")

      .insert([{ title, description, category, zip, date, time, contact }]);



    if (error) {

      return res.status(500).json({ error: error.message });

    }

    return res.status(200).json({ data });

  }



  if (req.method === "GET") {

    const { data, error } = await supabase.from("requests").select("*");



    if (error) {

      return res.status(500).json({ error: error.message });

    }

    return res.status(200).json({ data });

  }



  return res.status(405).json({ error: "Method not allowed" });

}
