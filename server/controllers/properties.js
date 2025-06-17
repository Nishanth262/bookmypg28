import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all properties with filtering
export const getAllProperties = async (req, res) => {
  try {
    const { 
      stateId, 
      districtId, 
      city, 
      roomTypes, 
      priceMin, 
      priceMax,
      status = 'APPROVED'
    } = req.query;

    const where = {
      status,
      available: true
    };

    // Location filters
    if (stateId) where.stateId = stateId;
    if (districtId) where.districtId = districtId;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    // Room type filters
    if (roomTypes) {
      const types = roomTypes.split(',');
      const roomTypeConditions = [];
      
      if (types.includes('SINGLE')) roomTypeConditions.push({ availableSingleRooms: { gt: 0 } });
      if (types.includes('DOUBLE')) roomTypeConditions.push({ availableDoubleRooms: { gt: 0 } });
      if (types.includes('TRIPLE')) roomTypeConditions.push({ availableTripleRooms: { gt: 0 } });
      if (types.includes('QUAD')) roomTypeConditions.push({ availableQuadRooms: { gt: 0 } });
      
      if (roomTypeConditions.length > 0) {
        where.OR = roomTypeConditions;
      }
    }

    // Price range filters
    if (priceMin || priceMax) {
      const priceConditions = [];
      const priceFilter = {};
      
      if (priceMin) priceFilter.gte = parseFloat(priceMin);
      if (priceMax) priceFilter.lte = parseFloat(priceMax);
      
      priceConditions.push({ singlePrice: priceFilter });
      priceConditions.push({ doublePrice: priceFilter });
      priceConditions.push({ triplePrice: priceFilter });
      priceConditions.push({ quadPrice: priceFilter });
      
      where.OR = where.OR ? [...where.OR, ...priceConditions] : priceConditions;
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            reviews: true,
            bookings: {
              where: {
                status: 'CONFIRMED',
                isActive: true
              }
            }
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Calculate real-time availability
    const propertiesWithAvailability = properties.map(property => ({
      ...property,
      ownerName: property.owner.name,
      ownerAvatar: property.owner.avatar,
      activeBookings: property._count.bookings,
      reviewCount: property._count.reviews
    }));

    res.json(propertiesWithAvailability);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get featured properties
export const getFeaturedProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        featured: true,
        status: 'APPROVED',
        available: true
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      take: 6,
      orderBy: { rating: 'desc' }
    });

    res.json(properties);
  } catch (error) {
    console.error('Get featured properties error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get property by ID
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        bookings: {
          where: {
            isActive: true,
            status: 'CONFIRMED'
          },
          select: {
            roomType: true,
            startDate: true,
            endDate: true
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create property (Owner only)
export const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      city,
      state,
      stateId,
      district,
      districtId,
      pincode,
      singleRooms,
      doubleRooms,
      tripleRooms,
      quadRooms,
      singlePrice,
      doublePrice,
      triplePrice,
      quadPrice,
      deposit,
      amenities,
      images
    } = req.body;

    // Calculate total capacity
    const totalCapacity = (1 * singleRooms) + (2 * doubleRooms) + (3 * tripleRooms) + (4 * quadRooms);

    const property = await prisma.property.create({
      data: {
        title,
        description,
        address,
        city,
        state,
        stateId,
        district,
        districtId,
        pincode,
        singleRooms,
        doubleRooms,
        tripleRooms,
        quadRooms,
        availableSingleRooms: singleRooms,
        availableDoubleRooms: doubleRooms,
        availableTripleRooms: tripleRooms,
        availableQuadRooms: quadRooms,
        totalCapacity,
        occupiedCapacity: 0,
        singlePrice,
        doublePrice,
        triplePrice,
        quadPrice,
        deposit,
        amenities,
        images,
        ownerId: req.user.userId,
        status: 'PENDING' // Requires admin approval
      }
    });

    res.status(201).json(property);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update property
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user owns the property or is admin
    const property = await prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.ownerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Recalculate capacity if room counts changed
    if (updateData.singleRooms !== undefined || 
        updateData.doubleRooms !== undefined || 
        updateData.tripleRooms !== undefined || 
        updateData.quadRooms !== undefined) {
      
      const singleRooms = updateData.singleRooms ?? property.singleRooms;
      const doubleRooms = updateData.doubleRooms ?? property.doubleRooms;
      const tripleRooms = updateData.tripleRooms ?? property.tripleRooms;
      const quadRooms = updateData.quadRooms ?? property.quadRooms;
      
      updateData.totalCapacity = (1 * singleRooms) + (2 * doubleRooms) + (3 * tripleRooms) + (4 * quadRooms);
      
      // Update available rooms (maintain the difference)
      updateData.availableSingleRooms = singleRooms - (property.singleRooms - property.availableSingleRooms);
      updateData.availableDoubleRooms = doubleRooms - (property.doubleRooms - property.availableDoubleRooms);
      updateData.availableTripleRooms = tripleRooms - (property.tripleRooms - property.availableTripleRooms);
      updateData.availableQuadRooms = quadRooms - (property.quadRooms - property.availableQuadRooms);
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData
    });

    res.json(updatedProperty);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete property
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.ownerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.property.delete({
      where: { id }
    });

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update room availability (internal function)
export const updateRoomAvailability = async (propertyId, roomType, increment = false) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });

  if (!property) {
    throw new Error('Property not found');
  }

  const updateData = {};
  let capacityChange = 0;

  switch (roomType) {
    case 'SINGLE':
      updateData.availableSingleRooms = increment 
        ? property.availableSingleRooms + 1 
        : property.availableSingleRooms - 1;
      capacityChange = increment ? -1 : 1;
      break;
    case 'DOUBLE':
      updateData.availableDoubleRooms = increment 
        ? property.availableDoubleRooms + 1 
        : property.availableDoubleRooms - 1;
      capacityChange = increment ? -2 : 2;
      break;
    case 'TRIPLE':
      updateData.availableTripleRooms = increment 
        ? property.availableTripleRooms + 1 
        : property.availableTripleRooms - 1;
      capacityChange = increment ? -3 : 3;
      break;
    case 'QUAD':
      updateData.availableQuadRooms = increment 
        ? property.availableQuadRooms + 1 
        : property.availableQuadRooms - 1;
      capacityChange = increment ? -4 : 4;
      break;
  }

  updateData.occupiedCapacity = property.occupiedCapacity + capacityChange;

  return await prisma.property.update({
    where: { id: propertyId },
    data: updateData
  });
};