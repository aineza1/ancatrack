import { Router } from 'express'
import multer from 'multer'
import { protect, restrictTo } from '../middleware/authMiddleware'
import { importVisits } from '../controllers/importController'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ]
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      cb(null, true)
    } else {
      cb(new Error('Only .xlsx, .xls, and .csv files are allowed'))
    }
  }
})

const router = Router()

router.use(protect)

router.post(
  '/',
  restrictTo('nurse', 'admin'),
  upload.single('file'),
  importVisits
)

export default router
