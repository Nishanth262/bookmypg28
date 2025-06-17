import { PrismaClient } from '@prisma/client';
import { updateRoomAvailability } from './properties.js';

const prisma = new PrismaClient();

// Create booking with synchronized inventory management
export const createBooking = async (req, res) => {
  const { propertyId, roomType, startMonth, startYear, durationMonths } = req.body;

  // Start transaction for atomic booking
  const result = await prisma.$transaction(async (tx) => {
    try {
      // Lock the property record for update
      const property = await tx.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          availableSingleRooms: true,
          availableDoubleRooms: true,
          availableTripleRooms: true,
          availableQuadRooms: true,
          singlePrice: true,
          doublePrice: true,
          triplePrice: true,
          quadPrice: true,
          status: true,
          available: true
        }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      if (property.status !== 'APPROVED' || !property.available) {
        throw new Error('Property is not available for booking');
      }

      // Check room availability
      let availableRooms = 0;
      let monthlyPrice = 0;

      switch (roomType) {
        case 'SINGLE':
          availableRooms = property.availableSingleRooms;
          monthlyPrice = property.singlePrice;
          break;
        case 'DOUBLE':
          availableRooms = property.availableDoubleRooms;
          monthlyPrice = property.doublePrice;
          break;
        case 'TRIPLE':
          availableRooms = property.availableTripleRooms;
          monthlyPrice = property.triplePrice;
          break;
        case 'QUAD':
          availableRooms = property.availableQuadRooms;
          monthlyPrice = property.quadPrice;
          break;
        default:
          throw new Error('Invalid room type');
      }

      if (availableRooms <= 0) {
        throw new Error(`No ${roomType.toLowerCase()} sharing rooms available`);
      }

      // Calculate dates
      const startDate = new Date(startYear, startMonth - 1, 1); // First day of month
      const endDate = new Date(startYear, startMonth - 1 + durationMonths, 0); // Last day of end month
      const totalAmount = monthlyPrice * durationMonths;

      // Check for overlapping bookings
      const overlappingBooking = await tx.booking.findFirst({
        where: {
          propertyId,
          roomType,
          isActive: true,
          OR: [
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } }
              ]
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } }
              ]
            },
            {
              AND: [
                { startDate: { gte: startDate } },
                { endDate: { lte: endDate } }
              ]
            }
          ]
        }
      });

      if (overlappingBooking) {
        throw new Error('Room is already booked for the selected period');
      }

      // Update room availability
      const updateData = { occupiedCapacity: { increment: 0 } };
      
      switch (roomType) {
        case 'SINGLE':
          updateData.availableSingleRooms = { decrement: 1 };
          updateData.occupiedCapacity = { increment: 1 };
          break;
        case 'DOUBLE':
          updateData.availableDoubleRooms = { decrement: 1 };
          updateData.occupiedCapacity = { increment: 2 };
          break;
        case 'TRIPLE':
          updateData.availableTripleRooms = { decrement: 1 };
          updateData.occupiedCapacity = { increment: 3 };
          break;
        case 'QUAD':
          updateData.availableQuadRooms = { decrement: 1 };
          updateData.occupiedCapacity = { increment: 4 };
          break;
      }

      await tx.property.update({
        where: { id: propertyId },
        data: updateData
      });

      // Create booking record
      const booking = await tx.booking.create({
        data: {
          propertyId,
          userId: req.user.userId,
          roomType,
          startMonth,
          startYear,
          durationMonths,
          startDate,
          endDate,
          monthlyAmount: monthlyPrice,
          totalAmount,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          isActive: true,
          isExpired: false
        },
        include: {
          property: {
            select: {
              title: true,
              images: true,
              address: true,
              city: true
            }
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return booking;
    } catch (error) {
      throw error;
    }
  });

  res.status(201).json({
    message: 'Booking created successfully',
    booking: result
  });
};

// Get user bookings
export const getUserBookings = async (req, res) => {
  try {
    const { status, isActive } = req.query;
    
    const where = {
      userId: req.user.userId
    };

    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            images: true,
            address: true,
            city: true,
            state: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: {
              select: {
                name: true,
                phone: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is the property owner or admin
    if (booking.userId !== req.user.userId && 
        booking.property.ownerId !== req.user.userId && 
        req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, paymentId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (booking.userId !== req.user.userId && 
        booking.property.ownerId !== req.user.userId && 
        req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentId) updateData.paymentId = paymentId;

    // If payment is completed, confirm the booking
    if (paymentStatus === 'COMPLETED') {
      updateData.status = 'CONFIRMED';
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: {
          property: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check authorization
      if (booking.userId !== req.user.userId && req.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
      }

      if (booking.status === 'CANCELLED') {
        throw new Error('Booking is already cancelled');
      }

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          isActive: false
        }
      });

      // Restore room availability if booking was confirmed
      if (booking.status === 'CONFIRMED') {
        const updateData = { occupiedCapacity: { decrement: 0 } };
        
        switch (booking.roomType) {
          case 'SINGLE':
            updateData.availableSingleRooms = { increment: 1 };
            updateData.occupiedCapacity = { decrement: 1 };
            break;
          case 'DOUBLE':
            updateData.availableDoubleRooms = { increment: 1 };
            updateData.occupiedCapacity = { decrement: 2 };
            break;
          case 'TRIPLE':
            updateData.availableTripleRooms = { increment: 1 };
            updateData.occupiedCapacity = { decrement: 3 };
            break;
          case 'QUAD':
            updateData.availableQuadRooms = { increment: 1 };
            updateData.occupiedCapacity = { decrement: 4 };
            break;
        }

        await tx.property.update({
          where: { id: booking.propertyId },
          data: updateData
        });
      }

      return updatedBooking;
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking: result
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Extend booking
export const extendBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalMonths } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Only confirmed bookings can be extended' });
    }

    // Calculate new end date and amount
    const newEndDate = new Date(booking.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);
    
    const additionalAmount = booking.monthlyAmount * additionalMonths;
    const newTotalAmount = booking.totalAmount + additionalAmount;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        durationMonths: booking.durationMonths + additionalMonths,
        endDate: newEndDate,
        totalAmount: newTotalAmount
      }
    });

    res.json({
      message: 'Booking extended successfully',
      booking: updatedBooking,
      additionalAmount
    });
  } catch (error) {
    console.error('Extend booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check and update expired bookings (cron job function)
export const updateExpiredBookings = async () => {
  try {
    const now = new Date();
    
    const expiredBookings = await prisma.booking.findMany({
      where: {
        endDate: { lt: now },
        isActive: true,
        isExpired: false,
        status: 'CONFIRMED'
      },
      include: {
        property: true
      }
    });

    for (const booking of expiredBookings) {
      await prisma.$transaction(async (tx) => {
        // Mark booking as expired
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'EXPIRED',
            isActive: false,
            isExpired: true
          }
        });

        // Restore room availability
        const updateData = { occupiedCapacity: { decrement: 0 } };
        
        switch (booking.roomType) {
          case 'SINGLE':
            updateData.availableSingleRooms = { increment: 1 };
            updateData.occupiedCapacity = { decrement: 1 };
            break;
          case 'DOUBLE':
            updateData.availableDoubleRooms = { increment: 1 };
            updateData.occupiedCapacity = { decrement: 2 };
            break;
          case 'TRIPLE':
            updateData.availableTripleRooms = { increment: 1 };
            updateData.occupiedCapacity = { decrement: 3 };
            break;
          case 'QUAD':
            updateData.availableQuadRooms = { increment: 1 };
            updateData.occupiedCapacity = { decrement: 4 };
            break;
        }

        await tx.property.update({
          where: { id: booking.propertyId },
          data: updateData
        });
      });
    }

    console.log(`Updated ${expiredBookings.length} expired bookings`);
    return expiredBookings.length;
  } catch (error) {
    console.error('Update expired bookings error:', error);
    throw error;
  }
};