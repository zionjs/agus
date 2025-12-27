import axios from "axios";
import FormData from "form-data";

export default async function handler(req, res) {
  try {
    const audioUrl = req.query.url;

    if (!audioUrl) {
      return res.json({
        status: false,
        message: "parameter url audio wajib diisi"
      });
    }

    // 1️⃣ download audio dari URL (buffer)
    const audio = await axios.get(audioUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10)"
      }
    });

    // 2️⃣ upload ke aivocalremover
    const form = new FormData();
    form.append("fileName", Buffer.from(audio.data), {
      filename: "audio.mp3"
    });

    const upload = await axios.post(
      "https://aivocalremover.com/api/v2/FileUpload",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "User-Agent": "Mozilla/5.0 (Linux; Android 10)"
        }
      }
    );

    if (!upload?.data?.file_name) {
      return res.json({
        status: false,
        message: "upload gagal"
      });
    }

    // 3️⃣ proses vocal remover
    const body = new URLSearchParams({
      file_name: upload.data.file_name,
      action: "watermark_video",
      key: "X9QXlU9PaCqGWpnP1Q4IzgXoKinMsKvMuMn3RYXnKHFqju8VfScRmLnIGQsJBnbZFdcKyzeCDOcnJ3StBmtT9nDEXJn",
      web: "web"
    });

    const process = await axios.post(
      "https://aivocalremover.com/api/v2/ProcessFile",
      body.toString(),
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
          "Content-Type": "application/x-www-form-urlencoded",
          origin: "https://aivocalremover.com",
          referer: "https://aivocalremover.com/"
        }
      }
    );

    if (!process?.data?.instrumental_path) {
      return res.json({
        status: false,
        message: "proses gagal"
      });
    }

    // 4️⃣ result
    return res.json({
      status: true,
      instrumental: process.data.instrumental_path,
      vocal: process.data.vocal_path || null
    });

  } catch (e) {
    return res.status(500).json({
      status: false,
      error: e.message
    });
  }
}