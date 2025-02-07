import activity from "../models/activity.js";

function logActivity(req, res, next) {
  const { adminId, action, resource } = req.body; // Assuming adminId is passed in request body
  const log = new activity({
    adminId,
    action,
    resource,
  });
  // log.save(err => {
  //     if (err) {
  //         console.error('Error logging activity:', err);
  //         // Handle error logging here
  //     }
  // });
  next();
}

export default {
  logActivity,
};
