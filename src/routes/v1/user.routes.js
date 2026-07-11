// user.routes.js
const express = require("express");
const auth    = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const userValidation = require("../../validations/user.validation");
const userController = require("../../controllers/user.controller");
const userFileUploadMiddleware = require("../../middlewares/fileUpload");
const convertHeicToPngMiddleware = require("../../middlewares/converter");

const UPLOADS_FOLDER_USERS     = "./public/uploads/users";
const UPLOADS_FOLDER_PROVIDERS = "./public/uploads/providers";

const uploadUsers     = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);
const uploadProviders = userFileUploadMiddleware(UPLOADS_FOLDER_PROVIDERS);

const router = express.Router();

// ─── Own profile ────────────────────────────────────────────────────────────────
router.get("/self/in", auth("common"), userController.getProfile);

router.patch(
  "/self/update",
  auth("common"),
  validate(userValidation.updateUser),
  uploadUsers.single("image"),
  convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
  userController.updateProfile
);

// ─── Complete profile: USER (client) ────────────────────────────────────────────
// Accepts optional In-Body scan files (field: inBodyDocuments)
router.post(
  "/complete-profile/user",
  auth("user"),
  uploadUsers.array("inBodyDocuments", 5),
  validate(userValidation.completeUserProfile),
  userController.completeUserProfile
);

// ─── Complete profile: PROVIDER ─────────────────────────────────────────────────
// Accepts:  certificateImages (required, up to 10)
//           otherDocuments    (optional, up to 10)
router.post(
  "/complete-profile/provider",
  auth("provider"),
  uploadProviders.fields([
    { name: "certificateImages", maxCount: 10 },
    { name: "otherDocuments",    maxCount: 10 },
  ]),
  validate(userValidation.completeProviderProfile),
  userController.completeProviderProfile
);

// ─── Admin routes ────────────────────────────────────────────────────────────────
router.get(
  "/providers/pending",
  auth("admin"),
  userController.getPendingProviders
);

router.patch(
  "/providers/:userId/review",
  auth("admin"),
  validate(userValidation.reviewProviderProfile),
  userController.reviewProviderProfile
);

router.get(
  "/",
  auth("admin"),
  validate(userValidation.getUsers),
  userController.getUsers
);

router.get(
  "/:userId",
  auth("admin"),
  validate(userValidation.getUser),
  userController.getUser
);

router.delete(
  "/:userId",
  auth("admin"),
  validate(userValidation.deleteUser),
  userController.deleteUser
);

module.exports = router;







// // user.routes.js

// const express = require("express");
// const auth = require("../../middlewares/auth");
// const validate = require("../../middlewares/validate");
// const userValidation = require("../../validations/user.validation");
// const userController = require("../../controllers/user.controller");
// const userFileUploadMiddleware = require("../../middlewares/fileUpload");
// const convertHeicToPngMiddleware = require("../../middlewares/converter");
// const UPLOADS_FOLDER_USERS = "./public/uploads/users";

// const uploadUsers = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);

// const router = express.Router();

// router.route("/self/in").get(auth("common"), userController.getProfile);

// router
//   .route("/self/update")
//   .patch(
//     auth("common"),
//     validate(userValidation.updateUser),
//     [uploadUsers.single("image")],
//     convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
//     userController.updateProfile
//   );

  

// module.exports = router;
