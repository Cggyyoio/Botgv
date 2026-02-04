const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

const TOKEN = '8433082614:AAHJgi7amxX_QX1J-ErUFWQQ9LL7Cyn1cYM';
const CHAT_ID = '-1003609204442';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    let data = { surah: 1, ayah: 0 };
    if (fs.existsSync('progress.json')) {
        try { data = JSON.parse(fs.readFileSync('progress.json')); } catch (e) {}
    }

    let nextAyah = data.ayah + 1;
    let nextSurah = data.surah;

    try {
        const surahRes = await axios.get(`https://api.alquran.cloud/v1/surah/${nextSurah}`);
        if (nextAyah > surahRes.data.data.numberOfAyahs) {
            nextAyah = 1;
            nextSurah++;
        }
        if (nextSurah > 114) return console.log("تم الختم!");

        const sName = surahRes.data.data.name;
        const audioUrl = `https://everyayah.com/data/Minshawy_Murattal_128kbps/${String(nextSurah).padStart(3, '0')}${String(nextAyah).padStart(3, '0')}.mp3`;
        
        console.log(`جاري المعالجة: سورة ${sName} آية ${nextAyah}`);

        // إنشاء الفيديو باستخدام FFmpeg
        execSync(`ffmpeg -loop 1 -i background.jpg -i "${audioUrl}" -c:v libx264 -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -shortest output.mp4`);

        const FormData = require('form-data');
        const form = new FormData();
        form.append('chat_id', CHAT_ID);
        form.append('video', fs.createReadStream('output.mp4'));
        form.append('caption', `سورة ${sName} - الآية ${nextAyah}\n#video_${nextSurah}_${nextAyah}`);

        const response = await axios.post(`https://api.telegram.org/bot${TOKEN}/sendVideo`, form, {
            headers: form.getHeaders()
        });

        if (response.data.ok) {
            console.log("تم الإرسال بنجاح. جاري الانتظار 5 ثوانٍ...");
            await delay(5000); // الانتظار المطلوب
            fs.writeFileSync('progress.json', JSON.stringify({ surah: nextSurah, ayah: nextAyah }));
        }
    } catch (error) {
        console.error("خطأ:", error.message);
        process.exit(1);
    }
}
run();
