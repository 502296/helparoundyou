export const config = { runtime: 'nodejs20.x' }; // أول سطر في الملف
import { createClient } from '@supabase/supabase-js';



function cors(res){

  const origin = process.env.CORS_ORIGIN || '*';

  res.setHeader('Access-Control-Allow-Origin', origin);

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

}



export default async function handler(req, res){

  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();



  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);



  try {

    if (req.method === 'GET'){

      const { cat, zip } = req.query;

      let q = supabase.from('requests').select('*').order('created_at', { ascending:false }).limit(60);

      if (cat) q = q.eq('category', cat);

      if (zip) q = q.like('zip', `${zip}%`);

      const { data, error } = await q;

      if (error) throw error;

      return res.status(200).json({ data });

    }



    if (req.method === 'POST'){

      const p = req.body || {};

      if (!p.title || !p.category || !p.zip) return res.status(400).json({ error: 'title, category, zip are required' });



      const { error } = await supabase.from('requests').insert({

        title: String(p.title).slice(0,200),

        category: p.category,

        zip: String(p.zip).slice(0,10),

        need_date: p.need_date || null,

        need_time: p.need_time || null,

        description: p.description || null,

        contact_name: p.contact_name || null,

        contact_phone: p.contact_phone || null,

        contact_email: p.contact_email || null,

        files: Array.isArray(p.files) ? p.files : null

      });

      if (error) throw error;

      return res.status(200).json({ ok:true });

    }



    return res.status(405).json({ error: 'Method not allowed' });

  } catch (e){

    console.error(e);

    return res.status(500).json({ error: 'Server error' });

  }

}
