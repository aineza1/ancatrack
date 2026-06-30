import { Router } from 'express'
import { getPatients, getPatient, createPatient, addVisit } from '../controllers/patientController'
import { protect, restrictTo } from '../middleware/authMiddleware'

const router = Router()

router.use(protect)

router.get('/',          getPatients)
router.get('/:id',       getPatient)
router.post('/',         restrictTo('nurse', 'admin'), createPatient)
router.post('/:id/visits', restrictTo('nurse', 'admin'), addVisit)

export default router
