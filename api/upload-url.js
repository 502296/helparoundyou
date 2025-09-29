export const config = { runtime: 'nodejs20.x' }; // أول سطر في الملف
import { createClient } from '@supabase/supabase-js';



export default async function handler(req, res) {

  const origin = process.env.CORS_ORIGIN || '*';

  res.setHeader('Access-Control-Allow-Origin', origin);

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });



  try {

    const { filename, contentType } = req.body || {};

    if (!filename) return res.status(400).json({ error: 'filename required' });



    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

    const bucket = process.env.SUPABASE_BUCKET || 'hay-uploads';



    const safe = filename.replace(/[^\w.\-]/g, '_');

    const path = `${Date.now()}_${Math.random().toString(36).slice(2,8)}_${safe}`;



    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

    if (error) throw error;



    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);



    return res.status(200).json({

      uploadUrl: data?.signedUrl,

      path,

      publicUrl: pub?.publicUrl,

      contentType: contentType || 'application/octet-stream'

    });

  } catch (e) {

    console.error(e);

    return res.status(500).json({ error: 'Failed to create upload URL' });

  }

}
