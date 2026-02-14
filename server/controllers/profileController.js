import Profile from '../models/Profile.js';

const getCurrentProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      ['name', 'email', 'avatar', 'role']
    );

    if (!profile) {
      return res.status(404).json({ message: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const createOrUpdateProfile = async (req, res) => {
  const {
    bio,
    phoneNumber,
    city,
    country,
    subjects,
    experience,
    availability,
    gradeLevel,
    schoolOrUniversity,
    learningNeeds
  } = req.body;

  const profileFields = {
    user: req.user._id,
    bio,
    phoneNumber,
    city,
    country,
    experience,
    gradeLevel,
    schoolOrUniversity,
    learningNeeds
  };

  if (subjects) {
    profileFields.subjects = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
  }
  if (availability) {
    profileFields.availability = Array.isArray(availability) ? availability : availability.split(',').map(s => s.trim());
  }

  if (req.files && req.files.length > 0) {
    profileFields.verificationDocuments = req.files.map(file => file.path);
  }

  try {
    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      if (profileFields.verificationDocuments) {
         profile = await Profile.findOneAndUpdate(
           { user: req.user._id },
           { 
             $set: profileFields,
             $push: { verificationDocuments: { $each: profileFields.verificationDocuments } }
           },
           { new: true }
         );
      } else {
         profile = await Profile.findOneAndUpdate(
           { user: req.user._id },
           { $set: profileFields },
           { new: true }
         );
      }
      return res.json(profile);
    }

    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar', 'role']);
    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

export { getCurrentProfile, createOrUpdateProfile, getAllProfiles };