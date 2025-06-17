import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Admin login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // In production, use proper password hashing
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: 'admin', role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: 'admin',
        name: 'Administrator',
        role: 'ADMIN'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard metrics
export const getDashboardMetrics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalProperties,
      totalBookings,
      activeBookings,
      pendingProperties,
      blockedUsers,
      revenue
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.property.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { isActive: true, status: 'CONFIRMED' } }),
      prisma.property.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.booking.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true }
      })
    ]);

    // Get top cities
    const topCities = await prisma.property.groupBy({
      by: ['city'],
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: 5
    });

    // Get recent activities
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        property: { select: { title: true, city: true } }
      }
    });

    const recentProperties = await prisma.property.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true } }
      }
    });

    res.json({
      metrics: {
        totalUsers,
        totalOwners,
        totalProperties,
        totalBookings,
        activeBookings,
        pendingProperties,
        blockedUsers,
        revenue: revenue._sum.totalAmount || 0
      },
      topCities: topCities.map(city => ({
        name: city.city,
        count: city._count.city
      })),
      recentActivities: {
        bookings: recentBookings,
        properties: recentProperties
      }
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users with filtering
export const getAllUsers = async (req, res) => {
  try {
    const { role, isBlocked, search, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (isBlocked !== undefined) where.isBlocked = isBlocked === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isBlocked: true,
          createdAt: true,
          _count: {
            select: {
              properties: true,
              bookings: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Block/Unblock user
export const toggleUserBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked }
    });

    res.json({
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user
    });
  } catch (error) {
    console.error('Toggle user block error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all properties for admin
export const getAllPropertiesAdmin = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          _count: {
            select: {
              bookings: true,
              reviews: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.property.count({ where })
    ]);

    res.json({
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all properties admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve/Reject property
export const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const updateData = { status };
    if (status === 'REJECTED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Create notification for property owner
    await prisma.notification.create({
      data: {
        title: `Property ${status.toLowerCase()}`,
        message: status === 'APPROVED' 
          ? `Your property "${property.title}" has been approved and is now live!`
          : `Your property "${property.title}" has been rejected. Reason: ${rejectionReason}`,
        type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
        userId: property.ownerId
      }
    });

    res.json({
      message: `Property ${status.toLowerCase()} successfully`,
      property
    });
  } catch (error) {
    console.error('Update property status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all bookings for admin
export const getAllBookingsAdmin = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { property: { title: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              owner: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all bookings admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Override booking status
export const overrideBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true } },
        property: { select: { title: true } }
      }
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        title: 'Booking Status Updated',
        message: `Your booking for "${booking.property.title}" has been ${status.toLowerCase()}${reason ? `. Reason: ${reason}` : ''}`,
        type: status === 'CONFIRMED' ? 'SUCCESS' : 'WARNING',
        userId: booking.userId
      }
    });

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Override booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send global notification
export const sendGlobalNotification = async (req, res) => {
  try {
    const { title, message, type = 'INFO' } = req.body;

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        isGlobal: true
      }
    });

    res.json({
      message: 'Global notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send global notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system analytics
export const getSystemAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Booking trends
    const bookingTrends = await prisma.booking.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    // Revenue by month
    const revenueByMonth = await prisma.booking.groupBy({
      by: ['startMonth', 'startYear'],
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      _sum: { totalAmount: true },
      orderBy: [{ startYear: 'asc' }, { startMonth: 'asc' }]
    });

    // Popular room types
    const roomTypeStats = await prisma.booking.groupBy({
      by: ['roomType'],
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startDate }
      },
      _count: { roomType: true }
    });

    // City-wise properties
    const cityStats = await prisma.property.groupBy({
      by: ['city', 'state'],
      where: {
        status: 'APPROVED'
      },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: 10
    });

    res.json({
      bookingTrends,
      revenueByMonth,
      roomTypeStats,
      cityStats
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};