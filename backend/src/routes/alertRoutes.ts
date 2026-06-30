import { Router } from 'express'
import { getAlerts, acknowledgeAlert, escalateAlert } from '../controllers/alertController'
import { protect, restrictTo } from '../middleware/authMiddleware'

const router = Router()

router.use(protect)

router.get('/',                      getAlerts)
router.patch('/:id/acknowledge',     restrictTo('doctor', 'admin'), acknowledgeAlert)
router.patch('/:id/escalate',        restrictTo('doctor', 'admin'), escalateAlert)

export default router
