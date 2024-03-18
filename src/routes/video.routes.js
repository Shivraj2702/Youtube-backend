import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();


router
    .route("/")
    .get(  getAllVideos)
    .post(
        verifyJWT, 
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbNail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(verifyJWT , getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch( verifyJWT ,upload.single("thumbNail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT ,togglePublishStatus);

export default router