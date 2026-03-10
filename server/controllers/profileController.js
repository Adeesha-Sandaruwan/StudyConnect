import Profile from '../models/Profile.js';
import User from '../models/User.js';

const getCurrentProfile = async (req, res) => {
  try {// Find the profile associated with the currently authenticated user
  //  and populate the user field with name, email, avatar, and role
    const profile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      ['name', 'email', 'avatar', 'role']
    );

    if (!profile) {
      return res.status(404).json({ message: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (error) {//
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const createOrUpdateProfile = async (req, res) => {
  // Destructure all the profile fields from the request body
  const {
    bio,
    phoneNumber,
    city,
    country,
    dob,
    gender,
    nicNumber,
    emergencyContactName,
    emergencyContactRelation,
    emergencyContactPhone,
    subjects,
    experience,
    availability,
    gradeLevel,
    schoolOrUniversity,
    learningNeeds
  } = req.body;

  const profileFields = {
    // Set the user field to the ID of the currently authenticated user
    user: req.user._id,
    bio,
    phoneNumber,
    city,
    country,
    dob,
    gender,
    nicNumber,
    experience,
    gradeLevel,
    schoolOrUniversity,
    learningNeeds
  };

  profileFields.emergencyContact = {
    // Set the emergency contact details in a nested object
    name: emergencyContactName,
    relation: emergencyContactRelation,
    phoneNumber: emergencyContactPhone
  };

  if (subjects) {
    // Convert the subjects string into an array if it's not already an array
    profileFields.subjects = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
  }
  if (availability) {
    profileFields.availability = Array.isArray(availability) ? availability : availability.split(',').map(s => s.trim());
  }

  if (req.files) {
    // Handle file uploads for NIC front, NIC back, and certificates
    if (req.files.avatar && req.files.avatar.length > 0) {
      await User.findByIdAndUpdate(req.user._id, { avatar: req.files.avatar[0].path });
    }
    if (req.files.nicFront && req.files.nicFront.length > 0) {
      profileFields.nicFront = req.files.nicFront[0].path;
    }
    // Check if the NIC back file is uploaded and set its path in the profile fields
    if (req.files.nicBack && req.files.nicBack.length > 0) {
      profileFields.nicBack = req.files.nicBack[0].path;
    }
    // Check if certificate files are uploaded and set their paths in the profile fields as an array
    if (req.files.certificates && req.files.certificates.length > 0) {
      profileFields.certificates = req.files.certificates.map(file => file.path);
    }
  }

  try {
    // Check if a profile already exists for the user
    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      // If a profile exists, update it with the new profile fields
      if (req.files && req.files.certificates) {
         profile = await Profile.findOneAndUpdate(
           { user: req.user._id },
           { 
             $set: profileFields,// Update the profile fields with the new values
             $push: { certificates: { $each: profileFields.certificates } }
           },
           { new: true }
         );
      } else {
         profile = await Profile.findOneAndUpdate(
          
           { user: req.user._id },//update profile no modification to certificates
           { $set: profileFields },// Update the profile fields with the new values
           { new: true }
         );
      }
      return res.json(profile);
    }

    profile = new Profile(profileFields);
    await profile.save();// Save the new profile to the database
    res.json(profile);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const getAllProfiles = async (req, res) => {
  try {// Implement pagination by reading page and limit from query parameters
    const page = parseInt(req.query.page) || 1;
    // Calculate the number of documents to skip based on the current page and limit
    const limit = parseInt(req.query.limit) || 10;
    // Calculate the number of documents to skip based on the current page and limit
    const skip = (page - 1) * limit;

    // Build the query object to filter profiles
    const query = { verificationStatus: 'verified' };//

    if (req.query.city) {
      // Use a case-insensitive regular expression to filter profiles by city
      query.city = { $regex: req.query.city, $options: 'i' };
    }
    if (req.query.subject) {
      // Use a case-insensitive regular expression to filter profiles by subjects
      query.subjects = { $regex: req.query.subject, $options: 'i' };
    }

    const profiles = await Profile.find(query)
    // Populate the user field with name, avatar, and role for each profile
      .populate('user', ['name', 'avatar', 'role'])
      .skip(skip)
      .limit(limit);

      // Count the total number of profiles that match the query for pagination purposes
    const total = await Profile.countDocuments(query);

    res.json({
      profiles,
      page,
      pages: Math.ceil(total / limit),
      total
    });// Return the profiles along with pagination information
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};


const getPendingProfiles = async (req, res) => {
  try {
    // Implement pagination by reading page and limit from query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Calculate the number of documents to skip based on the current page and limit
    const skip = (page - 1) * limit;

    // Build the query object to filter profiles with pending verification status
    const query = { verificationStatus: 'pending' };

    const profiles = await Profile.find(query)
    // Populate the user field with name, email, and role for each profile
      .populate('user', ['name', 'email', 'role'])
      .skip(skip)
      .limit(limit);

    const total = await Profile.countDocuments(query);
  

    res.json({
      profiles,
      page,
      pages: Math.ceil(total / limit),
      total
    });// Return the pending profiles along with pagination information
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const getProfileById = async (req, res) => {
  try {// Find the profile by its ID and populate the user field with name, email, avatar, and role
    const profile = await Profile.findById(req.params.id).populate('user', ['name', 'email', 'avatar', 'role']);
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {

    console.error(error.message);
    if (error.kind === 'ObjectId') {// If the error is due to an invalid ObjectId, return a 404 response
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
};

const updateProfileStatus = async (req, res) => {
  try {// Destructure the status from the request body
    const { status } = req.body;
    
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.verificationStatus = status;
    // Save the updated profile to the database
    await profile.save();


    res.json({ message: `Profile marked as ${status}`, profile });
    // Return a success message along with the updated profile
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const deleteProfile = async (req, res) => {
  try {// Find the profile by its ID
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await Profile.deleteOne({ _id: profile._id });
    res.json({ message: 'Profile removed successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

export { 
  getCurrentProfile, 
  createOrUpdateProfile, 
  getAllProfiles,
  getPendingProfiles,
  getProfileById,
  updateProfileStatus,
  deleteProfile
};