import express from 'express';
import { 
  getAllProperties, 
  getPropertyById, 
  createProperty,
  updateProperty,
  deleteProperty,
  getFeaturedProperties
} from '../controllers/properties.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { validateProperty } from '../middleware/validation.js';

const router = express.Router();

router.get('/', getAllProperties);
router.get('/featured', getFeaturedProperties);
router.get('/:id', getPropertyById);

// Protected routes - Fixed role names to match enum
router.post('/', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), validateProperty, createProperty);
router.put('/:id', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), validateProperty, updateProperty);
router.delete('/:id', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), deleteProperty);

export default router;