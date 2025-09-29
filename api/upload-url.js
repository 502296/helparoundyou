import { createClient } from '@supabase/supabase-js';



export default async function handler(req, res) {

  // ---- CORS ----

  const origin = process.env.CORS_ORIGIN || '*';

  res.setHeader('Access-Control-Allow-Origin', origin);

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();



  if (req.method !== 'POST') {

    return res.status(405).json({ error: 'Method not allowed' });

  }



  try {

    const { filename, contentType } = req.body || {};

    if (!filename) return res.status(400).json({ error: 'filename required' });



    const supabase = createClient(

      process.env.SUPABASE_URL,

      process.env.SUPABASE_SERVICE_ROLE

    );



    const bucket = process.env.SUPABASE_BUCKET || 'hay-uploads';



    // مسار آمن للملف

    const safeName = String(filename).replace(/[^\w.\-]/g, '_');

    const path = `${Date.now()}_${Math.random().toString(36).slice(2,8)}_${safeName}`;



    // رابط رفع موقّع (صالح لفترة قصيرة)

    const { data, error } = await supabase

      .storage

      .from(bucket)

      .createSignedUploadUrl(path);



    if (error) throw error;



    // رابط عام للعرض بعد الرفع (لأن البكت Public)

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);



    return res.status(200).json({

      uploadUrl: data?.signedUrl,

      path,

      publicUrl: pub?.publicUrl,

      contentType: contentType || 'application/octet-stream'

    });

  } catch (err) {

    console.error('upload-url error:', err);

    return res.status(500).json({ error: 'Failed to create upload URL' });

  }

}
