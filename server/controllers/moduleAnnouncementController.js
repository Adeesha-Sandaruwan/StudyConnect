import ModuleAnnouncement from '../models/ModuleAnnouncement.js';

export const getModuleAnnouncements = async (req, res) => {
  try {
    const { grade, subject, moduleType } = req.query;
    const query = {};

    if (grade !== undefined) {
      const gradeNum = Number(grade);
      if (Number.isNaN(gradeNum)) {
        return res.status(400).json({ message: 'grade must be a number' });
      }
      query.grade = gradeNum;
    }
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ message: 'subject is required' });
    }
    query.subject = String(subject).trim();

    if (!moduleType || !['school', 'course'].includes(moduleType)) {
      return res.status(400).json({ message: 'moduleType must be school or course' });
    }
    query.moduleType = moduleType;

    const announcements = await ModuleAnnouncement.find(query)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    return res.status(200).json(announcements);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createModuleAnnouncement = async (req, res) => {
  try {
    const { grade, subject, moduleType, message } = req.body;
    if (grade === undefined || subject === undefined || moduleType === undefined || message === undefined) {
      return res.status(400).json({ message: 'grade, subject, moduleType, message are required' });
    }

    const gradeNum = Number(grade);
    if (Number.isNaN(gradeNum) || gradeNum < 0 || gradeNum > 13) {
      return res.status(400).json({ message: 'grade must be 0..13' });
    }
    if (!['school', 'course'].includes(moduleType)) {
      return res.status(400).json({ message: 'moduleType must be school or course' });
    }
    const trimmedSubject = String(subject).trim();
    if (!trimmedSubject) {
      return res.status(400).json({ message: 'subject cannot be empty' });
    }
    const trimmedMessage = String(message).trim();
    if (!trimmedMessage) {
      return res.status(400).json({ message: 'message cannot be empty' });
    }

    const announcement = await ModuleAnnouncement.create({
      grade: gradeNum,
      subject: trimmedSubject,
      moduleType,
      message: trimmedMessage,
      createdBy: req.user._id,
    });

    return res.status(201).json(announcement);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const isOwnerOrAdminAnnouncement = (announcement, user) => {
  if (!announcement || !user) return false;
  if (String(announcement.createdBy) === String(user._id)) return true;
  return user.role === 'admin';
};

export const updateModuleAnnouncement = async (req, res) => {
  try {
    const announcement = await ModuleAnnouncement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (!isOwnerOrAdminAnnouncement(announcement, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { message } = req.body;
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }

    announcement.message = message.trim();
    await announcement.save();

    return res.status(200).json(announcement);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteModuleAnnouncement = async (req, res) => {
  try {
    const announcement = await ModuleAnnouncement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (!isOwnerOrAdminAnnouncement(announcement, req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await announcement.deleteOne();
    return res.status(200).json({ message: 'Announcement deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
