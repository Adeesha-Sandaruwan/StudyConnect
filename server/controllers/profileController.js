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
    name: emergencyContactName,
    relation: emergencyContactRelation,
    phoneNumber: emergencyContactPhone
  };

  if (subjects) {
    profileFields.subjects = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
  }
  if (availability) {
    profileFields.availability = Array.isArray(availability) ? availability : availability.split(',').map(s => s.trim());
  }

  if (req.files) {
    if (req.files.nicFront && req.files.nicFront.length > 0) {
      profileFields.nicFront = req.files.nicFront[0].path;
    }
    if (req.files.nicBack && req.files.nicBack.length > 0) {
      profileFields.nicBack = req.files.nicBack[0].path;
    }
    if (req.files.certificates && req.files.certificates.length > 0) {
      profileFields.certificates = req.files.certificates.map(file => file.path);
    }
  }

  try {
    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      if (req.files && req.files.certificates) {
         profile = await Profile.findOneAndUpdate(
           { user: req.user._id },
           { 
             $set: profileFields,
             $push: { certificates: { $each: profileFields.certificates } }
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