// ربط Supabase

const SUPABASE_URL = "https://afqjgrcoiwitfftbjltp.supabase.co";  // URL الصحيح من لوحة Supabase

const SUPABASE_ANON_KEY = "ضع هنا الـ anon key اللي نسخته";

const BUCKET = "uploads"; // اسم الباكيت



const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



// التعامل مع النموذج

const form = document.getElementById("requestForm");



form.addEventListener("submit", async (e) => {

  e.preventDefault();



  // اجمع البيانات

  const title = document.getElementById("title").value;

  const category = document.getElementById("category").value;

  const zip = document.getElementById("zip").value;

  const date = document.getElementById("date").value;

  const description = document.getElementById("description").value;

  const file = document.getElementById("file").files[0];



  // ارفع الصورة لو موجودة

  let fileUrl = null;

  if (file) {

    const filePath = `req_${Date.now()}_${file.name}`;

    const { error: uploadError } = await sb.storage.from(BUCKET).upload(filePath, file);



    if (uploadError) {

      alert("خطأ في رفع الملف: " + uploadError.message);

      return;

    }



    // اجلب رابط عام

    const { data: publicUrl } = sb.storage.from(BUCKET).getPublicUrl(filePath);

    fileUrl = publicUrl.publicUrl;

  }



  // أضف الطلب في جدول requests

  const { error } = await sb.from("requests").insert([

    {

      title,

      category,

      zip,

      task_date: date,

      description,

      media_urls: fileUrl ? [fileUrl] : [],

    },

  ]);



  if (error) {

    alert("خطأ في حفظ الطلب: " + error.message);

  } else {

    alert("تم نشر طلبك بنجاح 🎉");

    form.reset();

  }

});
