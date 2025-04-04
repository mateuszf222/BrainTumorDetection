import { v4 as uuidv4 } from 'uuid'
import { Schema, model, Model, Connection } from 'mongoose'
import multer from 'multer'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

import axios from 'axios'
import FormData from 'form-data'

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create uploads directory if it doesn't exist
const uploadPath = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath)
}


// Configure multer
const upload = multer({
  dest: uploadPath
})

interface AnalyzerDoc {
  _id: string
  fileName: string
  originalName?: string
  uploadDate: Date
  result: string
}


const schema = new Schema<AnalyzerDoc>({
  _id: { type: String, default: uuidv4 },
  fileName: { type: String, required: true },
  originalName: { type: String },
  uploadDate: { type: Date, default: Date.now },
  result: { type: String }
})


const analyzer: {
  endpoint: string
  model: Model<AnalyzerDoc> | null
  init: (conn: Connection) => void
  post: any[]
  } = {
  endpoint: '/api/analyzer',
  model: null,
    

  init: conn => {
    analyzer.model = conn.model('analyzer', schema)
  },

  post: [
    upload.single('photo'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'Brak przesłanego pliku' })
      }
  
      try {
        const form = new FormData()
        form.append('photo', fs.createReadStream(req.file.path), req.file.originalname)
  
        const fastApiResponse = await axios.post(
          'http://localhost:8001/analyze', // or your container/service IP
          form,
          { headers: form.getHeaders(), responseType: 'arraybuffer' }
        )
  
        const result = fastApiResponse.data
  
        const item = new analyzer.model!({
          fileName: req.file.filename,
          originalName: req.file.originalname,
          result
        })
  
        const err = item.validateSync()
        if (err) return res.status(400).json({ error: err.message })
  
        await item.save()

        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete uploaded file:', err)
        })

        res.setHeader('Content-Type', 'image/jpeg')
        res.send(result) // from FastAPI
  
      } catch (err: any) {
        res.status(500).json({ error: err.message })
      }
    }
  ]
}
export default analyzer;
