import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Fetch default seeded sandbox user profile (includes cloud storage metrics)
 */
export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let user = await User.findOne({ email: 'user@voxnote.ai' });
    if (!user) {
      // Fallback in case of startup delay or seeding bypass
      user = await User.create({
        name: 'Sandbox User',
        email: 'user@voxnote.ai',
        avatar: 'VN',
        accountType: 'Premium AI Sandbox',
        storageLimit: 100 * 1024 * 1024, // 100MB
        storageUsed: 4.2 * 1024 * 1024,  // 4.2MB starter data
      });
      console.log(`[UserController] Default sandbox user seeded on demand.`);
    }

    ApiResponse.success(res, user, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};
