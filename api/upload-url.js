import { v4 as uuidv4 } from "uuid";

import { createClient } from "@supabase/supabase-js";



const supabase = createClient(

  process.env.SUPABASE_URL,

  process.env.SUPABASE_KEY

);



export default async function handler(req, res) {

  if (req.method === "POST") {

    try {

      const fileName = `${uuidv4()}.jpg`;



      const { data, error } = await supabase.storage

        .from("uploads")

        .createSignedUploadUrl(fileName);



      if (error) {

        return res.status(500).json({ error: error.message });

      }



      return res.status(200).json({ url: data.signedUrl });

    } catch (err) {

      return res.status(500).json({ error: err.message });

    }

  }



  return res.status(405).json({ error: "Method not allowed" });

}
