const express = require('express');
const { admin } = require('../firebase/config');
const db = admin.firestore();
const router = express.Router();
router.get('/room_details', async (req, res) => {
  try {
    const bhawansSnapshot = await db.collection('Bhawans').get();
    const bhawansData = {};

    for (const bhawanDoc of bhawansSnapshot.docs) {
      const bhawanName = bhawanDoc.id;
      const roomTypesSnapshot = await db.collection('Bhawans').doc(bhawanName).collection('Room_Type').get();

      bhawansData[bhawanName] = [];
      roomTypesSnapshot.forEach(roomDoc => {
        bhawansData[bhawanName].push({
          roomType: roomDoc.id,
          ...roomDoc.data()
        });
      });
    }
    res.json(bhawansData);
  } catch (error) {
    console.error('Error fetching bhawans:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const roomDoc = await db.collection('Rooms').doc(id).get();

    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ id: roomDoc.id, ...roomDoc.data() });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/update-room', async (req, res) => {
  try {
    const { roomId, newOccupied, members } = req.body;
    
    if (!roomId || newOccupied === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    // Get the current room data to verify the update is valid
    const roomDoc = await db.collection('Rooms').doc(roomId).get();
    
    if (!roomDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Room not found' 
      });
    }
    
    const roomData = roomDoc.data();
    
    // Verify that the new occupancy doesn't exceed the room's capacity
    if (newOccupied > roomData.occupancy) {
      return res.status(400).json({
        success: false,
        error: 'Occupancy cannot exceed room capacity'
      });
    }

    // Prepare update object
    const updateData = {
      occupied: newOccupied
    };
    
    // Handle members array if provided
    if (members && Array.isArray(members)) {
      // Get existing members or initialize empty array
      const existingMembers = roomData.members || [];
      
      // Add new members to existing members
      const updatedMembers = [...existingMembers, ...members];
      
      // Update the members field
      updateData.members = updatedMembers;
    }
    
    // Update the room document with all changes
    await db.collection('Rooms').doc(roomId).update(updateData);
    
    res.json({
      success: true,
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error' 
    });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    
    // Query rooms where this user is a member
    const roomsQuery = await db.collection('Rooms')
      .where('members', 'array-contains', userId)
      .limit(1)  // Assuming a user can be in only one room
      .get();
    
    if (roomsQuery.empty) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found in any room' 
      });
    }
    
    // Get the first room document ID
    const roomId = roomsQuery.docs[0].id;
    
    res.json({ roomId });
    
  } catch (error) {
    console.error('Error fetching user room ID:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error' 
    });
  }
});


// router.get('/room_details/:bhawanName', async (req, res) => {
//   try {
//     const { bhawanName } = req.params;
//     const roomTypesSnapshot = await db.collection('Bhawans').doc(bhawanName).collection('Room_Type').get();

//     if (roomTypesSnapshot.empty) {
//       return res.status(404).json({ error: 'Bhawan not found or has no rooms' });
//     }

//     const roomTypes = [];
//     roomTypesSnapshot.forEach(doc => {
//       roomTypes.push({
//         roomType: doc.id,
//         ...doc.data()
//       });
//     });

//     res.json({ bhawanName, roomTypes });
//   } catch (error) {
//     console.error(`Error fetching data for Bhawan ${req.params.bhawanName}:`, error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// router.get('/room_details/:bhawanName/:roomType', async (req, res) => {
//   try {
//     const { bhawanName, roomType } = req.params;
//     const roomDoc = await db.collection('Bhawans').doc(bhawanName).collection('Room_Type').doc(roomType).get();

//     if (!roomDoc.exists) {
//       return res.status(404).json({ error: 'Room type not found' });
//     }

//     res.json({ bhawanName, roomType, ...roomDoc.data() });
//   } catch (error) {
//     console.error(`Error fetching data for ${roomType} in ${bhawanName}:`, error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

module.exports = router;
